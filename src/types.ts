import type { SlackEdgeAppEnv } from "slack-cloudflare-workers";

export interface AppEnv extends SlackEdgeAppEnv {
	GEMINI_API_KEY: string;
	ESA_API_TOKEN: string;
	ESA_TEAM_NAME: string;
}