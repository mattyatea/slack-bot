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

class SlackBot {
	private readonly app: SlackApp<AppEnv>;
	private readonly gemini: GeminiClient;
	private readonly esa: EsaClient;

	constructor(env: AppEnv) {
		this.app = new SlackApp({ env });
		this.gemini = new GeminiClient({ apiKey: env.GEMINI_API_KEY });
		this.esa = new EsaClient({
			token: env.ESA_API_TOKEN,
			teamName: env.ESA_TEAM_NAME,
		});
		this.registerHandlers();
	}

	private registerHandlers(): void {
		// /askコマンド
		this.app.command(
			"/ask",
			async () => {},
			async (args) => {
				await handleAskCommand(args, this.gemini);
			},
		);

		// ショートカット
		this.app.shortcut(
			"ask-shortcut",
			async () => {},
			async (args) => {
				await handleAskShortcut(args);
			},
		);

		// モデル選択
		this.app.options("models", async (args) => {
			return await handleModelOptions(args, this.gemini);
		});

		// モーダル送信
		this.app.view(
			"ai-modal",
			async () => {},
			(args) => handleAiModalSubmission(args, this.gemini),
		);

		// メンション
		this.app.event("app_mention", async (args) => {
			await handleAppMention(args, this.gemini, this.esa);
		});
	}

	async fetch(
		request: Request,
		env: AppEnv,
		ctx: ExecutionContext,
	): Promise<Response> {
		return this.app.run(request, ctx);
	}
}

let bot: SlackBot;

export default {
	async fetch(
		request: Request,
		env: AppEnv,
		ctx: ExecutionContext,
	): Promise<Response> {
		if (!bot) {
			bot = new SlackBot(env);
		}
		return bot.fetch(request, env, ctx);
	},
};
