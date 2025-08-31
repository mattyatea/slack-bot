import type { SlackViewHandler } from "../../../types";

/**
 * AIモーダル送信ハンドラー
 * モーダルからの入力を処理してGemini APIにリクエストを送る
 */
export const handleAiModalSubmission: SlackViewHandler = async (
	args,
	gemini,
) => {
	// 入力の検証
	const askContent = args.payload.view.state.values.context.input.value ?? "";
	if (askContent.length < 1) {
		return {
			response_action: "errors",
			errors: { context: "内容は1文字以上で記述してください" } as Record<string, string>,
		};
	}

	const model = args.payload.view.state.values.model.models.selected_option?.value;
	if (!model) {
		return {
			response_action: "errors",
			errors: { model: "モデルを選択してください" } as Record<string, string>,
		};
	}

	try {
		// モデルの存在確認
		if (!(await gemini.isExistModel(model))) {
			return {
				response_action: "errors",
				errors: { model: "そのモデルは存在しません" } as Record<string, string>,
			};
		}

		// コンテンツの生成
		const response = await gemini.generateContent(askContent, model);
		if (!response) {
			return {
				response_action: "errors",
				errors: { context: "AIからの応答がありませんでした" } as Record<string, string>,
			};
		}

		// メッセージの送信
		await args.client.chat.postMessage({
			channel: args.payload.user.id,
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
	} catch (error) {
		console.error("AI modal submission error:", error);
		return {
			response_action: "errors",
			errors: {
				context:
					"エラーが発生しました。しばらくしてからもう一度お試しください。",
			} as Record<string, string>,
		};
	}
};
