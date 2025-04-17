import type { EsaClient } from "esa-api-client";
import type { GeminiClient } from "../services";

// Slackイベント関連の型定義
interface SlackContext {
	botId?: string;
	botToken?: string;
	teamId?: string;
	enterpriseId?: string | null;
}

interface SlackPayload {
	[key: string]: unknown;
}

interface SlackBody {
	[key: string]: unknown;
}

interface SlackClient {
	chat: {
		postMessage: (params: unknown) => Promise<unknown>;
	};
	[key: string]: unknown;
}

// 具体的な型を定義
export type SlackCommandHandler = (
	args: { context: SlackContext; payload: SlackPayload },
	gemini: GeminiClient,
) => Promise<unknown>;

export type SlackShortcutHandler = (
	args: { context: SlackContext; body: SlackBody },
	gemini?: GeminiClient,
) => Promise<void>;

export type SlackViewHandler = (
	args: { payload: SlackPayload; client: SlackClient },
	gemini: GeminiClient,
) => Promise<unknown>;

export type SlackOptionsHandler = (
	args: { payload: SlackPayload },
	gemini: GeminiClient,
) => Promise<unknown>;

export type SlackEventHandler = (
	args: { context: SlackContext; payload: SlackPayload },
	gemini: GeminiClient,
	esa: EsaClient,
) => Promise<void>;
