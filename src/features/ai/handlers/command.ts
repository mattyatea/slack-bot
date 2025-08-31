import type { SlackCommandHandler } from "../../../types";

/**
 * askコマンドハンドラー
 * テキストを受け取りGemini APIを使って応答する
 */
export const handleAskCommand: SlackCommandHandler = async (
	args,
	gemini,
) => {
	const text = args.payload.text || "";
	if (text.length === 0) {
		await args.context.respond({
			response_type: "ephemeral",
			text: "質問内容を入力してください",
		});
		return;
	}

	try {
		const response = await gemini.generateContent(text);
		await args.context.respond({
			response_type: "in_channel",
			text: `<@${args.context.userId}> \n ${response}`,
		});
	} catch (error) {
		console.error("Gemini API error:", error);
		await args.context.respond({
			response_type: "ephemeral",
			text: "申し訳ありません、AIからのレスポンス取得中にエラーが発生しました",
		});
	}
};
