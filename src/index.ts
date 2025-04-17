import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import { GeminiClient } from "./services/google";
import {
  handleAskCommand,
  handleAskShortcut,
  handleAiModalSubmission,
  handleModelOptions,
  handleAppMention
} from "./handlers";

export default {
  async fetch(
    request: Request,
    env: SlackEdgeAppEnv & {
			  GEMINI_API_KEY: string;
	},
    ctx: ExecutionContext
  ): Promise<Response> {
    // アプリとGeminiクライアントの初期化
    const app = new SlackApp({ env });
    const gemini = new GeminiClient({ apiKey: env.GEMINI_API_KEY });

    // コマンドハンドラー
    app.command("/ask",
      async (_req) => { /* ack関数 - 3秒以内に応答するため何もしない */ },
      async (args) => await handleAskCommand(args, gemini)
    );

    // ショートカットハンドラー
    app.shortcut("ask-shortcut",
      async () => { /* ack関数 - 何もしない */ },
      async (args) => await handleAskShortcut(args)
    );

    // モデル選択オプションハンドラー
    app.options("models",
      async (args) => await handleModelOptions(args, gemini)
    );

    // モーダル送信ハンドラー
	  app.view("ai-modal",
		  async () => {},
					  async (args) => {
			  const enhancedArgs = {
				  ...args,
				  client: args.context.client
			  };
			  return await handleAiModalSubmission(enhancedArgs, gemini);
		  }
	  );
    // メンションイベントハンドラー
    app.event("app_mention",
      async (args) => await handleAppMention(args, gemini)
    );

    // アプリを実行
    return await app.run(request, ctx);
  },
};
