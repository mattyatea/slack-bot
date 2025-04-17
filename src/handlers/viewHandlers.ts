import { SlackViewHandler } from "../types";
import { GeminiClient } from "../services/google";

/**
 * AIモーダル送信ハンドラー
 * モーダルからの入力を処理してGemini APIにリクエストを送る
 */
export const handleAiModalSubmission: SlackViewHandler = async ({ payload, client }, gemini) => {
  // 入力の検証
  const askContent = payload.view.state.values.context.input.value!;
  if (askContent.length < 1) {
    return {
      response_action: "errors",
      errors: { "context": "内容は1文字以上で記述してください" }
    };
  }

  const model = payload.view.state.values.model.models.selected_option?.value;
  if (!model) {
    return {
      response_action: "errors",
      errors: { "model": "モデルを選択してください" }
    };
  }

  try {
    // モデルの存在確認
    if (!await gemini.isExistModel(model)) {
      return {
        response_action: "errors",
        errors: { "model": "そのモデルは存在しません" }
      };
    }

    // コンテンツの生成
    const response = await gemini.generateContent(askContent, model);
    if (!response) {
      return {
        response_action: "errors",
        errors: { "context": "AIからの応答がありませんでした" }
      };
    }

    // メッセージの送信
    await client.chat.postMessage({
      channel: payload.user.id,
      text: response,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: response,
          },
        },
      ],
    });

    return;
  } catch (error) {
    console.error("AI modal submission error:", error);
    return {
      response_action: "errors",
      errors: { "context": "エラーが発生しました。しばらくしてからもう一度お試しください。" }
    };
  }
};
