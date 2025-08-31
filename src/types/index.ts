import type { EsaClient } from "esa-api-client";
import type {
	SlackRequestWithRespond,
	SlashCommand,
	SlackRequest,
	BlockSuggestion,
	SlackRequestWithOptionalRespond,
	ViewSubmission,
	SlackRequestWithChannelId,
	AppMentionEvent,
	GlobalShortcut,
	SlackOptionsResponse,
	SlackAPIClient,
} from "slack-cloudflare-workers";
import type { GeminiClient } from "../features/ai/services/gemini";
import type { AppEnv } from "../config/env";

// ハンドラーの型定義
export type SlackCommandHandler = (
	args: SlackRequestWithRespond<AppEnv, SlashCommand>,
	gemini: GeminiClient,
) => Promise<void>;

export type SlackShortcutHandler = (
	args: SlackRequest<AppEnv, GlobalShortcut>,
	gemini?: GeminiClient,
) => Promise<void>;

export type SlackViewHandler = (
	args: SlackRequestWithOptionalRespond<AppEnv, ViewSubmission> & {
		client: SlackAPIClient;
	},
	gemini: GeminiClient,
) => Promise<void | { response_action: string; errors?: Record<string, string> }>;

export type SlackOptionsHandler = (
	args: SlackRequest<AppEnv, BlockSuggestion>,
	gemini: GeminiClient,
) => Promise<SlackOptionsResponse>;

export type SlackEventHandler = (
	args: SlackRequestWithChannelId<AppEnv, AppMentionEvent>,
	gemini: GeminiClient,
	esa: EsaClient,
) => Promise<void>;
