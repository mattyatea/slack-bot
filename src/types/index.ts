import { GeminiClient } from '../services';

// 具体的な型が利用できないため、より汎用的な型を定義
export type SlackCommandHandler = (
	args: { context: any; payload: any },
	gemini: GeminiClient
) => Promise<any>;

export type SlackShortcutHandler = (
	args: { context: any; body: any },
	gemini?: GeminiClient
) => Promise<void>;

export type SlackViewHandler = (
	args: { payload: any; client: any },
	gemini: GeminiClient
) => Promise<any>;

export type SlackOptionsHandler = (
	args: { payload: any },
	gemini: GeminiClient
) => Promise<any>;

export type SlackEventHandler = (
	args: { context: any; payload: any },
	gemini: GeminiClient
) => Promise<void>;
