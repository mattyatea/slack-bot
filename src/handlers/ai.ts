import type {
	AppMentionEvent,
	SlackRequestWithChannelId,
	SlackRequestWithOptionalRespond,
	SlackRequestWithRespond,
	SlashCommand,
	ViewSubmission,
} from "slack-cloudflare-workers";
import type { GeminiClient } from "../services";
import { extractAskText } from "../utils";

/**
 * /askコマンドの処理 - AI質問
 */
export async function handleAskCommand<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(args: SlackRequestWithRespond<E, SlashCommand>, gemini: GeminiClient) {
	const text = args.payload.text || "";
	if (!text) {
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
}

/**
 * AIモーダル送信の処理
 */
export async function handleAiModalSubmission<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(
	args: SlackRequestWithOptionalRespond<E, ViewSubmission> & {
		client: import("slack-cloudflare-workers").SlackAPIClient;
	},
	gemini: GeminiClient,
	// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
): Promise<{ response_action: string; errors: Record<string, string> } | void> {
	const askContent = args.payload.view.state.values.context.input.value ?? "";
	if (askContent.length < 1) {
		return {
			response_action: "errors",
			errors: { context: "内容は1文字以上で記述してください" } as Record<
				string,
				string
			>,
		};
	}

	const model =
		args.payload.view.state.values.model.models.selected_option?.value;
	if (!model) {
		return {
			response_action: "errors",
			errors: { model: "モデルを選択してください" } as Record<string, string>,
		};
	}

	try {
		if (!(await gemini.isExistModel(model))) {
			return {
				response_action: "errors",
				errors: { model: "そのモデルは存在しません" } as Record<string, string>,
			};
		}

		const response = await gemini.generateContent(askContent, model);
		if (!response) {
			return {
				response_action: "errors",
				errors: { context: "AIからの応答がありませんでした" } as Record<
					string,
					string
				>,
			};
		}

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
}

/**
 * メンションでのAsk処理
 */
export async function handleAskMention<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	text: string,
	gemini: GeminiClient,
) {
	const askText = extractAskText(text);
	if (askText && askText.length > 0) {
		const response = await gemini.generateContent(askText);
		await args.context.say({
			text: `<@${args.context.userId}> \n ${response}`,
		});
	} else {
		await args.context.say({
			text: `<@${args.context.userId}> 質問を「ask」の後に続けて記述してください。例: @botname ask 天気について教えて`,
		});
	}
}
