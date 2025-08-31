import type {
	SlackRequest,
	GlobalShortcut,
	BlockSuggestion,
	SlackOptionsResponse,
} from "slack-cloudflare-workers";
import type { GeminiClient } from "../services";

/**
 * ショートカットでモーダルを開く
 */
export async function handleAskShortcut<E extends import("slack-cloudflare-workers").SlackAppEnv>(
	args: SlackRequest<E, GlobalShortcut>,
) {
	try {
		await args.context.client.views.open({
			trigger_id: args.body.trigger_id,
			view: {
				type: "modal",
				callback_id: "ai-modal",
				title: { type: "plain_text", text: "AIに聞く" },
				submit: { type: "plain_text", text: "聞く！" },
				close: { type: "plain_text", text: "聞かない" },
				blocks: [
					{
						type: "input",
						block_id: "context",
						label: { type: "plain_text", text: "質問したい内容" },
						element: {
							type: "plain_text_input",
							multiline: true,
							action_id: "input",
						},
					},
					{
						type: "input",
						block_id: "model",
						label: { type: "plain_text", text: "モデル" },
						element: {
							type: "external_select",
							action_id: "models",
							min_query_length: 0,
						},
					},
				],
			},
		});
	} catch (error) {
		console.error("Modal open error:", error);
	}
}

/**
 * モデル選択オプション
 */
export async function handleModelOptions<E extends import("slack-cloudflare-workers").SlackAppEnv>(
	args: SlackRequest<E, BlockSuggestion>,
	gemini: GeminiClient,
): Promise<SlackOptionsResponse> {
	try {
		const models = await gemini.getModels();
		const searchValue = args.payload.value;
		
		const filteredModels = models
			.filter((model) => {
				const isGeminiOrGemma =
					model.name.toLowerCase().includes("gemini") ||
					model.name.toLowerCase().includes("gemma");
				const excludedKeywords = ["embedding", "image", "vision"];
				const hasExcludedKeyword = excludedKeywords.some((keyword) =>
					model.name.toLowerCase().includes(keyword),
				);
				const matchesSearch =
					!searchValue ||
					model.name.toLowerCase().includes(searchValue.toLowerCase());
				return isGeminiOrGemma && !hasExcludedKeyword && matchesSearch;
			});

		return {
			options: filteredModels.map((model) => ({
				text: {
					type: "plain_text",
					text: model.displayName,
				},
				value: model.name,
			})),
		};
	} catch (error) {
		console.error("Model options error:", error);
		return { options: [] };
	}
}