import { EsaClient } from "esa-api-client";
import {
	type GlobalShortcut,
	SlackApp,
	type SlackRequest,
	type SlackRequestWithOptionalRespond,
	type ViewSubmission,
} from "slack-cloudflare-workers";
import {
	handleAiModalSubmission,
	handleAppMention,
	handleAskCommand,
	handleAskShortcut,
	handleModelOptions,
} from "./handlers";
import { GeminiClient } from "./services";
import type { AppEnv } from "./types";

export default {
	async fetch(
		request: Request,
		env: AppEnv,
		ctx: ExecutionContext,
	): Promise<Response> {
		const app = new SlackApp({ env });
		const gemini = new GeminiClient({ apiKey: env.GEMINI_API_KEY });
		const esa = new EsaClient({
			token: env.ESA_API_TOKEN,
			teamName: env.ESA_TEAM_NAME,
		});

		// /askコマンド
		app.command(
			"/ask",
			async () => {},
			async (args) => {
				await handleAskCommand(args, gemini);
			},
		);

		// ショートカット
		app.shortcut(
			"ask-shortcut",
			async () => {},
			async (args) => {
				// GlobalShortcutのみを処理
				if ("type" in args.payload && args.payload.type === "shortcut") {
					await handleAskShortcut(args as SlackRequest<AppEnv, GlobalShortcut>);
				}
			},
		);

		// モデル選択
		app.options("models", async (args) => {
			return await handleModelOptions(args, gemini);
		});

		// モーダル送信
		app.view(
			"ai-modal",
			async () => {},
			async (args) => {
				// ViewSubmissionのみを処理
				if ("view" in args.payload && "trigger_id" in args.payload) {
					const viewArgs = args as SlackRequestWithOptionalRespond<
						AppEnv,
						ViewSubmission
					>;
					const enhancedArgs = {
						...viewArgs,
						client: viewArgs.context.client,
					};
					const result = await handleAiModalSubmission(enhancedArgs, gemini);
					if (result) {
						// エラーレスポンスを型キャストして返す
						// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
						return result as unknown as void;
					}
				}
			},
		);

		// メンション
		app.event("app_mention", async (args) => {
			await handleAppMention(args, gemini, esa);
		});

		return await app.run(request, ctx);
	},
};
