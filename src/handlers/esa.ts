import type { EsaClient } from "esa-api-client";
import type {
	SlackRequestWithChannelId,
	AppMentionEvent,
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
export async function handleEsaSearch<E extends import("slack-cloudflare-workers").SlackAppEnv>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	text: string,
	esa: EsaClient,
) {
	const esaTitle = extractEsaTitle(text);
	if (esaTitle && esaTitle.length > 0) {
		const esaPosts = await esa.getPosts({
			q: encodeURI(esaTitle.replace(" ", "+")),
		});
		
		const messageText = `<@${args.context.userId}> \n\n${esaPosts.posts
			.map((post) => {
				return `*<${post.url}|${post.name}>*
:page_facing_up: ${post.category ? `*${post.category}*` : "カテゴリなし"}
:label: ${formatTags(post.tags)}
:bust_in_silhouette: ${post.created_by.screen_name} • :clock1: ${formatDate(post.created_at)}
———————————————\n`;
			})
			.join("")}`;
		
		await args.context.say({
			text: messageText,
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: messageText,
					},
				},
			],
		});
	} else {
		await args.context.say({
			text: `<@${args.context.userId}> 検索ワードを「esa」の後に続けて記述してください。例: @botname esa nodejs`,
		});
	}
}