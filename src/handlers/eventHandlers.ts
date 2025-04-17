import type { SlackEventHandler } from "../types";
import {
	extractAskText,
	extractCommandType,
	extractEsaTitle,
} from "../utils/messageUtils";

// 日付を整形する関数
const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	return date.toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
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
	try {
		const text = payload.text || "";
		const commendType = extractCommandType(text);

		switch (commendType) {
			case "ask": {
				const askText = extractAskText(text);
				if (askText && askText.length > 0) {
					const response = await gemini.generateContent(askText);
					await context.say({
						text: `<@${context.userId}> \n ${response}`,
					});
				} else {
					// 有効な質問テキストがなかった場合のフォールバックメッセージ
					await context.say({
						text: `<@${context.userId}> 質問を「ask」の後に続けて記述してください。例: @botname ask 天気について教えて`,
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
					await context.say({
						blocks: [
							{
								type: "section",
								text: {
									type: "mrkdwn",
									text: `<@${context.userId}> \n\n${esaPosts.posts
										.map((post) => {
											return `*<${post.url}|${post.name}>*
:page_facing_up: ${post.category ? `*${post.category}*` : "カテゴリなし"}
:label: ${formatTags(post.tags)}
:bust_in_silhouette: ${post.created_by.screen_name} • :clock1: ${formatDate(post.created_at)}
———————————————\n`;
										})
										.join("")}`,
								},
							},
						],
					});
				} else {
					await context.say({
						text: `<@${context.userId}> 検索ワードを「esa」の後に続けて記述してください。例: @botname esa nodejs`,
					});
				}
				break;
			}
			default: {
				await context.say({
					text: `<@${context.userId}> コマンドが認識できませんでした。`,
				});
				break;
			}
		}
	} catch (error) {
		console.error("App mention handler error:", error);
		await context.say({
			text: `<@${context.userId}> 申し訳ありません、エラーが発生しました。`,
		});
	}
};
