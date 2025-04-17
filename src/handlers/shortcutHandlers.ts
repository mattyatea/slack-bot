import type { SlackShortcutHandler } from "../types";

/**
 * askショートカットハンドラー
 * AIに質問するためのモーダルを表示する
 */
export const handleAskShortcut: SlackShortcutHandler = async ({
	context,
	body,
}) => {
	try {
		await context.client.views.open({
			trigger_id: body.trigger_id,
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
		// エラー通知を追加することも検討
	}
};
