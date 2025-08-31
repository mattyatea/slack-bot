import { EsaClient } from "esa-api-client";
import { SlackApp } from "slack-cloudflare-workers";
import type { AppEnv } from "../config/env";
import { handleAskCommand } from "../features/ai/handlers/command";
import { handleAppMention } from "../features/ai/handlers/mention";
import { handleAiModalSubmission } from "../features/ai/handlers/modal";
import { GeminiClient } from "../features/ai/services/gemini";
import { handleModelOptions } from "../features/slack/handlers/options";
import { handleAskShortcut } from "../features/slack/handlers/shortcuts";

export default {
	async fetch(
		request: Request,
		env: AppEnv,
		ctx: ExecutionContext,
	): Promise<Response> {
		// アプリとGeminiクライアントの初期化
		const app = new SlackApp({ env });
		const gemini = new GeminiClient({ apiKey: env.GEMINI_API_KEY });
		const esa = new EsaClient({
			token: env.ESA_API_TOKEN,
			teamName: env.ESA_TEAM_NAME,
		});

		// コマンドハンドラー
		app.command(
			"/ask",
			async () => {
				/* ack関数 - 3秒以内に応答するため何もしない */
			},
			async (args) => {
				await handleAskCommand(args, gemini);
			},
		);

		// ショートカットハンドラー
		app.shortcut(
			"ask-shortcut",
			async () => {
				/* ack関数 - 何もしない */
			},
			async (args) => {
				// GlobalShortcutのみを処理
				if (args.payload.type === "shortcut") {
					await handleAskShortcut(args as any);
				}
			},
		);

		// モデル選択オプションハンドラー
		app.options("models", async (args) => {
			return await handleModelOptions(args, gemini);
		});

		// モーダル送信ハンドラー
		app.view(
			"ai-modal",
			async () => {},
			async (args) => {
				// ViewSubmissionのみを処理
				if ("view" in args.payload && "state" in args.payload.view) {
					const enhancedArgs = {
						...args,
						client: args.context.client,
					} as any;
					const result = await handleAiModalSubmission(enhancedArgs, gemini);
					if (result) {
						return result as any;
					}
				}
			},
		);
		// メンションイベントハンドラー
		app.event("app_mention", async (args) => {
			await handleAppMention(args, gemini, esa);
		});

		// アプリを実行
		return await app.run(request, ctx);
	},
};
