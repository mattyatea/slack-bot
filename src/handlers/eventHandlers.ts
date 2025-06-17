import type { SlackEventHandler } from "../types";
import type { SlackClient } from "../types";
import {
	extractAskText,
	extractCommandType,
	extractEsaTitle,
} from "../utils/messageUtils";

// 日付を整形する関数
const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${year}/${month}/${day} ${hour}:${minute}`;
};

// タグをリンク付きで表示する関数
const formatTags = (tags: string[] | null) => {
	if (!tags || tags.length === 0) return "なし";
	return tags.map((tag) => `\`#${tag}\``).join(" ");
};

/**
 * メンション時のイベントハンドラー
 * メンションされたときにGemini APIを使って応答する
 */
export const handleAppMention: SlackEventHandler = async (
	{ context, payload },
	gemini,
	esa,
) => {
	const client = (context as { client: SlackClient }).client;
	const userId = (payload.user as string) || (payload.user_id as string) || "";
	try {
		const text = (payload.text as string) || "";
		const commendType = extractCommandType(text);

		switch (commendType) {
			case "ask": {
				const askText = extractAskText(text);
				if (askText && askText.length > 0) {
					const response = await gemini.generateContent(askText);
					await client.chat.postMessage({
						channel: userId,
						text: `<@${userId}> \n ${response}`,
					});
				} else {
					// 有効な質問テキストがなかった場合のフォールバックメッセージ
					await client.chat.postMessage({
						channel: userId,
						text: `<@${userId}> 質問を「ask」の後に続けて記述してください。例: @botname ask 天気について教えて`,
					});
				}
				break;
			}
			case "esa": {
				const esaTitle = extractEsaTitle(text);
				if (esaTitle && esaTitle.length > 0) {
					const esaPosts = await esa.getPosts({
						q: encodeURI(esaTitle.replace(" ", "+")),
					});
					await client.chat.postMessage({
						channel: userId,
						blocks: [
							{
								type: "section",
								text: {
									type: "mrkdwn",
									text: `<@${userId}> \n\n${(esaPosts.posts as unknown[])
										.map((post) => {
											const p = post as {
												url: string;
												name: string;
												category?: string;
												tags: string[];
												created_by: { screen_name: string };
												created_at: string;
											};
											return `*<${p.url}|${p.name}>*\n:page_facing_up: ${p.category ? `*${p.category}*` : "カテゴリなし"}\n:label: ${formatTags(p.tags)}\n:bust_in_silhouette: ${p.created_by.screen_name} • :clock1: ${formatDate(p.created_at)}\n———————————————\n`;
										})
										.join("")}`,
								},
							},
						],
					});
				} else {
					await client.chat.postMessage({
						channel: userId,
						text: `<@${userId}> 検索ワードを「esa」の後に続けて記述してください。例: @botname esa nodejs`,
					});
				}
				break;
			}
			default: {
				await client.chat.postMessage({
					channel: userId,
					text: `<@${userId}> コマンドが認識できませんでした。`,
				});
				break;
			}
		}
	} catch (error) {
		console.error("App mention handler error:", error);
		await client.chat.postMessage({
			channel: userId,
			text: `<@${userId}> 申し訳ありません、エラーが発生しました。`,
		});
	}
};
