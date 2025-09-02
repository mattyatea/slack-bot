# Slack Bot with Cloudflare Workers, Gemini, and esa.io

This project is a Slack bot that integrates with Google's Gemini AI and the esa.io knowledge base to answer questions within a Slack workspace. It's built with TypeScript and runs on Cloudflare Workers.

## ✨ Features

- **AI-Powered Answers**: Use the `/ask` command or @-mention the bot to get answers from the Gemini AI model.
- **Internal Knowledge Search**: The bot can search your team's `esa.io` articles for context when answering questions.
- **Interactive Modals**: A user-friendly modal interface for asking detailed questions.

## 🚀 Getting Started

### 1. Prerequisites

- A Slack App with a Bot Token and Signing Secret.
- A Cloudflare account with Wrangler CLI configured.
- A Google AI Studio API Key for Gemini.
- An `esa.io` API Token and Team Name.
- `pnpm` package manager.

### 2. Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### 3. Environment Variables

Create a `.dev.vars` file in the project root for local development, or configure the variables in your Cloudflare Worker's settings for production.

```
SLACK_SIGNING_SECRET="your-slack-signing-secret"
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
GEMINI_API_KEY="your-gemini-api-key"
ESA_API_TOKEN="your-esa-api-token"
ESA_TEAM_NAME="your-esa-team-name"
```

Refer to `wrangler.jsonc` for more configuration options.

### 4. Running the Bot

-   **Local Development:**
    ```bash
    pnpm dev
    ```
    This will start a local server. Use a tool like `cloudflared` to create a tunnel to expose this local server to the internet so Slack can send events to it.

-   **Deployment:**
    ```bash
    pnpm deploy
    ```
    This will deploy the bot to your Cloudflare Workers environment.

## 🛠️ Available Scripts

-   `pnpm dev`: Starts the development server.
-   `pnpm deploy`: Deploys the worker to Cloudflare.
-   `pnpm test`: Runs the test suite using Vitest.
-   `pnpm cf-typegen`: Generates types from `wrangler.jsonc`.
