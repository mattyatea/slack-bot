/**
 * Gemini AIサービスクライアント
 */
export interface GeminiModel {
	name: string;
	displayName: string;
	description?: string;
}

export class GeminiClient {
	private apiKey: string;
	private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

	constructor({ apiKey }: { apiKey: string }) {
		this.apiKey = apiKey;
	}

	async generateContent(prompt: string, model = "models/gemini-1.5-flash"): Promise<string> {
		const response = await fetch(
			`${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.statusText}`);
		}

		const data = await response.json() as {
			candidates?: Array<{
				content?: {
					parts?: Array<{ text?: string }>;
				};
			}>;
		};
		return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
	}

	async getModels(): Promise<GeminiModel[]> {
		const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
		
		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.statusText}`);
		}

		const data = await response.json() as { models?: GeminiModel[] };
		return data.models || [];
	}

	async isExistModel(modelName: string): Promise<boolean> {
		try {
			const models = await this.getModels();
			return models.some((model) => model.name === modelName);
		} catch {
			return false;
		}
	}
}