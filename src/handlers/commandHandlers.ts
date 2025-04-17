import { SlackCommandHandler } from "../types";
import { GeminiClient } from "../services/google";

/**
 * askコマンドハンドラー
 * テキストを受け取りGemini APIを使って応答する
 */
export const handleAskCommand: SlackCommandHandler = async ({ context, payload }, gemini) => {
  const text = payload.text || "";
  if (text.length === 0) {
    return context.respond({
      response_type: "ephemeral",
      text: "質問内容を入力してください",
    });
  }

  try {
    const response = await gemini.generateContent(text);
    return context.respond({
      response_type: "in_channel",
      text: `<@${context.userId}> \n ${response}`,
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return context.respond({
      response_type: "ephemeral",
      text: "申し訳ありません、AIからのレスポンス取得中にエラーが発生しました",
    });
  }
};
