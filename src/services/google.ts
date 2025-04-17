export interface GeminiOptions {
  apiKey: string;
  model?: string;
}

export interface GeminiRequestContent {
  parts: {
    text: string;
  }[];
}

export interface GeminiModel {
  name: string;
  baseModelId?: string;
  version?: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  temperature?: number;
  maxTemperature?: number;
  topP?: number;
  topK?: number;
}

interface GeminiResponseModel {
  models: GeminiModel[];
}

export interface GeminiRequest {
  contents: GeminiRequestContent[];
  system_instruction?: GeminiRequestContent;
}

export interface GeminiResponsePart {
  text: string;
}

export interface GeminiResponseContent {
  parts: GeminiResponsePart[];
  role: string;
}

export interface GeminiResponse {
  candidates: {
    content: GeminiResponseContent;
    finishReason: string;
    index: number;
  }[];
}

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(options: GeminiOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'gemini-2.0-flash';
  }

  /**
   * テキストをGemini APIに送信してレスポンスを取得
   */
  async generateContent(text: string, model?: string, isRetry?:boolean): Promise<string> {
    const useModel = model?.replace('models/', '') ?? this.model;
    const url = `${this.baseUrl}/models/${useModel}:generateContent?key=${this.apiKey}`;

    const requestBody: GeminiRequest = {
      system_instruction: {
        parts: [
          {
            text: "指示をされない限り日本語で返答して。"
          }
        ]
      },
      contents: [{
        parts: [{
          text: text
        }]
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API エラー (${response.status}): ${errorText}`);
      }

      const data = await response.json() as GeminiResponse;

      if (data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return '応答内容がありませんでした。';
      }
		} catch (error) {
			console.error('Gemini API リクエストエラー:', error);
			console.log(`リトライ: ${isRetry}`);
			if (isRetry) {
				throw error;
			} else {
				return await this.generateContent(text,this.model,true)
			}
		}
  }

  /**
   * 利用可能なモデル一覧を取得
   */
  async getModels(pageToken?: string): Promise<GeminiModel[]> {
    const url = `${this.baseUrl}/models?key=${this.apiKey}` + (pageToken ? `&pageToken=${pageToken}` : '');
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API エラー (${response.status}): ${errorText}`);
      }

      const data: GeminiResponseModel = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Gemini API リクエストエラー:', error);
      throw error;
    }
  }

  /**
   * 指定されたモデルが存在するか確認
   */
  async isExistModel(model: string): Promise<boolean> {
    const models = await this.getModels();
    return models.some((m) => m.name === model);
  }
}
