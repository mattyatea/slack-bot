import { SlackEventHandler } from "../types";
import { GeminiClient } from "../services/google";
import { extractAskText } from "../utils/messageUtils";

/**
 * メンション時のイベントハンドラー
 * メンションされたときにGemini APIを使って応答する
 */
export const handleAppMention: SlackEventHandler = async ({ context, payload }, gemini) => {
  try {
    const text = payload.text || "";
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
  } catch (error) {
    console.error("App mention handler error:", error);
    await context.say({
      text: `<@${context.userId}> 申し訳ありません、エラーが発生しました。`,
    });
  }
};
