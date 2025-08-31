import type { EsaClient } from "esa-api-client";
import type {
	AppMentionEvent,
	SlackAppContext,
	SlackRequestWithChannelId,
} from "slack-cloudflare-workers";
import { extractEsaCreateTitle } from "../utils";

async function getSlackUserDisplayName(
	client: SlackAppContext["client"],
	userId: string,
): Promise<string> {
	try {
		const userInfo = await client.users.info({ user: userId });
		const profile = userInfo.user?.profile;
		const displayName =
			profile?.display_name || userInfo.user?.real_name || userInfo.user?.name;
		return (displayName || "Unknown User").replace(/\//g, "_");
	} catch (error) {
		console.error("Error fetching user info:", error);
		return "Unknown User";
	}
}

export async function handleEsaCreateMention<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	text: string,
	esa: EsaClient,
) {
	const { context, payload } = args;

	if (!payload) {
		console.error("handleEsaCreateMention: payload is undefined");
		await context.say({
			text: "エラー: Slackからの情報が取得できませんでした。",
		});
		return;
	}

	const title = extractEsaCreateTitle(text);

	if (!title) {
		await context.say({
			text: `<@${context.userId}> 記事のタイトルを指定してください。

使い方:
• \`@bot esa create <タイトル>\` - Esa記事を作成
• \`@bot ec <タイトル>\` - Esa記事を作成（短縮形）`,
			thread_ts: payload.thread_ts || payload.ts,
		});
		return;
	}

	const threadTs = payload.thread_ts || payload.ts;
	const channelId = payload.channel;

	try {
		interface SlackMessage {
			ts?: string;
			user?: string;
			text?: string;
			files?: Array<{ name?: string; permalink?: string }>;
			[key: string]: unknown;
		}
		const allMessages: SlackMessage[] = [];
		let cursor: string | undefined = undefined;
		do {
			const replies = await context.client.conversations.replies({
				channel: channelId,
				ts: threadTs,
				cursor: cursor,
			});

			if (replies.messages) {
				allMessages.push(...(replies.messages as SlackMessage[]));
			}
			cursor = replies.response_metadata?.next_cursor;
		} while (cursor);

		if (allMessages.length === 0) {
			await context.say({
				text: `<@${context.userId}> スレッドにメッセージが見つかりませんでした。`,
				thread_ts: threadTs,
			});
			return;
		}

		const botUserId = context.botUserId;
		const filteredMessages = allMessages.filter((message) => {
			if (message.user === botUserId) {
				return false;
			}
			if (message.text?.includes(" esa create ")) {
				const mentionRegex = new RegExp(`<@${botUserId}>`);
				if (mentionRegex.test(message.text || "")) {
					return false;
				}
			}
			return true;
		});

		const userIds = new Set<string>();
		for (let i = 0; i < filteredMessages.length; i++) {
			const m = filteredMessages[i];
			if (m.user) {
				userIds.add(m.user);
			}
		}
		if (context.userId) {
			userIds.add(context.userId);
		}

		const userNames = new Map<string, string>();
		const userFetchPromises = new Map<string, Promise<void>>();

		for (const userId of userIds) {
			if (userId) {
				userFetchPromises.set(
					userId,
					(async () => {
						const userName = await getSlackUserDisplayName(
							context.client,
							userId,
						);
						userNames.set(userId, userName);
					})(),
				);
			}
		}

		await Promise.all(userFetchPromises.values());

		const commandUserName = context.userId
			? userNames.get(context.userId) || "Unknown User"
			: "Unknown User";
		const postName = `Users/${commandUserName}/${title}`;

		const bodyMd = filteredMessages
			.map((message) => {
				if (!message.ts || !message.user) {
					return null;
				}
				const userName = userNames.get(message.user) || "Unknown";
				const date = new Date(Number.parseInt(message.ts.split(".")[0]) * 1000);
				const formattedDate = date.toLocaleString("ja-JP");
				let messageContent = `**${userName}** (${formattedDate}):
${message.text}`;

				if (message.files && message.files.length > 0) {
					const fileLinks = message.files
						.map((file) => {
							if (!file.permalink) return "";
							return `
[${file.name}](${file.permalink})`;
						})
						.join("");
					messageContent += fileLinks;
				}
				return messageContent;
			})
			.filter(Boolean)
			.join("\n\n---\n\n");

		const post = await esa.createPost({
			name: postName,
			body_md: bodyMd,
			wip: true,
		});

		await context.say({
			thread_ts: threadTs,
			text: `EsaにWIP記事を作成しました: <${post.url}|${post.name}>`,
		});
	} catch (error) {
		console.error("Error creating Esa post:", error);
		await context.say({
			thread_ts: threadTs,
			text: `<@${context.userId}> Esa記事の作成中にエラーが発生しました。`,
		});
	}
}

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
	keyword: string,
	esa: EsaClient,
) {
	if (keyword && keyword.length > 0) {
		const esaPosts = await esa.getPosts({
			q: encodeURI(keyword.replace(/ /g, "+")),
		});

		if (esaPosts.posts.length === 0) {
			await args.context.say({
				text: `<@${args.context.userId}> 「${keyword}」に関する記事は見つかりませんでした。`,
			});
			return;
		}

		// 最大10件まで表示
		const postsToShow = esaPosts.posts.slice(0, 10);
		const postMessages = postsToShow.map((post) => {
			return `*<${post.url}|${post.name}>*
:page_facing_up: ${post.category ? `*${post.category}*` : "カテゴリなし"}
:label: ${formatTags(post.tags)}
:bust_in_silhouette: ${post.created_by.screen_name} • :clock1: ${formatDate(post.created_at)}
`;
		});

		// 文字数制限を考慮して分割送信
		let currentMessage = `<@${args.context.userId}> 「${keyword}」の検索結果（${esaPosts.posts.length}件中${postsToShow.length}件表示）

`;
		const messagesToSend = [];

		for (const postMessage of postMessages) {
			if (currentMessage.length + postMessage.length > 2900) {
				// 現在のメッセージを送信リストに追加
				messagesToSend.push(currentMessage);
				currentMessage = postMessage;
			} else {
				currentMessage += `${postMessage}———————————————
`;
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
