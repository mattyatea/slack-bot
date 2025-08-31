import type { EsaClient } from "esa-api-client";
import type {
	SlackRequestWithChannelId,
	AppMentionEvent,
} from "slack-cloudflare-workers";
import type { GeminiClient } from "../services";
import { extractCommandType } from "../utils";
import { handleAskMention } from "./ai";
import { handleEsaSearch } from "./esa";

/**
 * メンションイベントのルーティング
 */
export async function handleAppMention<E extends import("slack-cloudflare-workers").SlackAppEnv>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	gemini: GeminiClient,
	esa: EsaClient,
) {
	try {
		const text = args.payload.text || "";
		const commandType = extractCommandType(text);

		switch (commandType) {
			case "ask":
				await handleAskMention(args, text, gemini);
				break;
			
			case "esa":
				await handleEsaSearch(args, text, esa);
				break;
			
			default:
				await args.context.say({
					text: `<@${args.context.userId}> コマンドが認識できませんでした。\n使用可能なコマンド: ask, esa`,
				});
				break;
		}
	} catch (error) {
		console.error("App mention handler error:", error);
		await args.context.say({
			text: `<@${args.context.userId}> 申し訳ありません、エラーが発生しました。`,
		});
	}
}