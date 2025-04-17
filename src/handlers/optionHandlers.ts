import type { SlackOptionsHandler } from "../types";
import { filterModels } from "../utils";

/**
 * モデル選択オプションハンドラー
 * 利用可能なモデルリストを取得して返す
 */
export const handleModelOptions: SlackOptionsHandler = async (
	{ payload },
	gemini,
) => {
	try {
		const models = await gemini.getModels();
		const filteredModels = filterModels(models, payload.value);

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
		return {
			options: [], // エラーが発生した場合は空の配列を返す
		};
	}
};
