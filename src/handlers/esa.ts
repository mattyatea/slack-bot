import type { EsaClient } from "esa-api-client";
import type {
	AppMentionEvent,
	SlackRequestWithChannelId,
} from "slack-cloudflare-workers";
import { extractEsaTitle } from "../utils";

/**
 * 日付を整形
 */
function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * タグをフォーマット
 */
function formatTags(tags: string[] | null): string {
	if (!tags || tags.length === 0) return "なし";
	return tags.map((tag) => `\`#${tag}\``).join(" ");
}

/**
 * Esa検索処理
 */
export async function handleEsaSearch<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	text: string,
	esa: EsaClient,
) {
	const esaTitle = extractEsaTitle(text);
	if (esaTitle && esaTitle.length > 0) {
		const esaPosts = await esa.getPosts({
			q: encodeURI(esaTitle.replace(" ", "+")),
		});

		if (esaPosts.posts.length === 0) {
			await args.context.say({
				text: `<@${args.context.userId}> 「${esaTitle}」に関する記事は見つかりませんでした。`,
			});
			return;
		}

		// 最大10件まで表示
		const postsToShow = esaPosts.posts.slice(0, 10);
		const postMessages = postsToShow.map((post) => {
			return `*<${post.url}|${post.name}>*
:page_facing_up: ${post.category ? `*${post.category}*` : "カテゴリなし"}
:label: ${formatTags(post.tags)}
:bust_in_silhouette: ${post.created_by.screen_name} • :clock1: ${formatDate(post.created_at)}\n`;
		});

		const header = `<@${args.context.userId}> 「${esaTitle}」の検索結果（${esaPosts.posts.length}件中${postsToShow.length}件表示）\n\n`;

		// 文字数制限を考慮して分割送信
		let currentMessage = header;
		const messagesToSend = [];

		for (const postMessage of postMessages) {
			if (currentMessage.length + postMessage.length > 2900) {
				// 現在のメッセージを送信リストに追加
				messagesToSend.push(currentMessage);
				currentMessage = postMessage;
			} else {
				currentMessage += `${postMessage}———————————————\n`;
			}
		}

		// 最後のメッセージを追加
		if (currentMessage.length > 0) {
			messagesToSend.push(currentMessage);
		}

		// メッセージを順番に送信
		for (const message of messagesToSend) {
			await args.context.say({
				text: message,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: message.substring(0, 3000), // Slack制限対応
						},
					},
				],
			});
		}
	} else {
		await args.context.say({
			text: `<@${args.context.userId}> 検索ワードを「esa」の後に続けて記述してください。例: @botname esa nodejs`,
		});
	}
}
