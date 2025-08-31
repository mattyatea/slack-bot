import type { EsaClient } from "esa-api-client";
import type {
	AppMentionEvent,
	SlackRequestWithChannelId,
} from "slack-cloudflare-workers";
import type { GeminiClient } from "../services";
import {
	extractAskText,
	extractEsaCreateTitle,
	extractEsaSearchKeyword,
} from "../utils";
import { handleAskMention } from "./ai";
import { handleEsaCreateMention, handleEsaSearch } from "./esa";

/**
 * メンションイベントのルーティング
 */
export async function handleAppMention<
	E extends import("slack-cloudflare-workers").SlackAppEnv,
>(
	args: SlackRequestWithChannelId<E, AppMentionEvent>,
	gemini: GeminiClient,
	esa: EsaClient,
) {
	try {
		if (!args.payload) {
			console.error("handleAppMention: payload is undefined");
			return;
		}
		const text = args.payload.text || "";

		// esa create コマンドの判定（ecショートカット含む）
		if (text.includes(" esa create ") || text.match(/<@\w+>\s+ec\s+/i)) {
			await handleEsaCreateMention(args, text, esa);
			return;
		}

		// esa search コマンドの判定
		const searchKeyword = extractEsaSearchKeyword(text);
		if (searchKeyword) {
			await handleEsaSearch(args, searchKeyword, esa);
			return;
		}

		// ask コマンドの判定
		const askText = extractAskText(text);
		if (askText) {
			await handleAskMention(args, text, gemini);
			return;
		}

		// どのコマンドにもマッチしない場合
		await args.context.say({
			text: `<@${args.context.userId}> コマンドが認識できませんでした。

使用可能なコマンド:
• \`@bot ask <質問内容>\` - AIに質問
• \`@bot esa <検索キーワード>\` - Esa記事を検索
• \`@bot esa search <検索キーワード>\` - Esa記事を検索（明示的）
• \`@bot esa create <タイトル>\` - スレッドからEsa記事を作成
• \`@bot ec <タイトル>\` - スレッドからEsa記事を作成（短縮形）

スラッシュコマンド（チャンネルのみ）:
• \`/ask <質問>\` - AIに質問`,
		});
	} catch (error) {
		console.error("App mention handler error:", error);
		await args.context.say({
			text: `<@${args.context.userId}> 申し訳ありません、エラーが発生しました。`,
		});
	}
}
