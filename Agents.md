# Agents

このドキュメントは、Slack Botプロジェクトのアーキテクチャとエージェントの概要を説明します。

## プロジェクト概要

このプロジェクトは、Cloudflare Workers上で動作するSlackボットです。GoogleのGemini APIおよびesa.ioと連携し、Slack内で直接AIによる応答や情報検索を提供します。

## アーキテクチャ

- **プラットフォーム**: Cloudflare Workers
- **言語**: TypeScript
- **フレームワーク**: `slack-cloudflare-workers`
- **主要サービス**:
    - Slack API
    - Google Gemini API
    - esa.io API

## Agents (主要コンポーネント)

ボットの機能は、特定のインタラクションやタスクを処理する役割を持つ、いくつかの「エージェント」に分かれています。

### 1. Command Agent (コマンドエージェント)

- **トリガー**: `/ask` スラッシュコマンド
- **機能**: ユーザーの質問を受け取り、Gemini Agentに応答を依頼します。AIに直接質問するためのインターフェースです。
- **実装**:
    - `src/app/index.ts`: `app.command("/ask", ...)`
    - `src/features/ai/handlers/command.ts`: `handleAskCommand`

### 2. Shortcut Agent (ショートカットエージェント)

- **トリガー**: `ask-shortcut` グローバルショートカット
- **機能**: AIへの質問をより構造化された方法で入力できるモーダル(`ai-modal`)を開きます。
- **実装**:
    - `src/app/index.ts`: `app.shortcut("ask-shortcut", ...)`
    - `src/features/slack/handlers/shortcuts.ts`: `handleAskShortcut`

### 3. Modal Agent (モーダルエージェント)

- **トリガー**: `ai-modal` の送信
- **機能**: AI質問モーダルから送信されたデータを処理します。ユーザーのクエリと選択されたAIモデルを受け取り、その情報をGemini Agentに渡して応答を生成させます。また、その応答をユーザーまたは指定されたチャンネルに投稿します。
- **実装**:
    - `src/app/index.ts`: `app.view("ai-modal", ...)`
    - `src/features/ai/handlers/modal.ts`: `handleAiModalSubmission`

### 4. Mention Agent (メンションエージェント)

- **トリガー**: チャンネルでの `app_mention` イベント
- **機能**: 最も複雑なエージェントです。ボットがメンションされると、メッセージの内容を処理します。Gemini Agentを使って文脈を理解し応答を生成するほか、Esa Agentと連携してesa.ioチーム内の情報を検索・取得することもできます。
- **実装**:
    - `src/app/index.ts`: `app.event("app_mention", ...)`
    - `src/features/ai/handlers/mention.ts`: `handleAppMention`

### 5. Gemini Agent (サービス)

- **トリガー**: 他のエージェント（Command, Modal, Mention）からの呼び出し
- **機能**: Google Gemini APIのクライアントとして機能します。プロンプトを受け取ってAPIに送信し、生成されたテキストを返します。また、利用可能なAIモデルのリストも提供します。
- **実装**:
    - `src/features/ai/services/gemini.ts`: `GeminiClient`

### 6. Esa Agent (サービス)

- **トリガー**: Mention Agentからの呼び出し
- **機能**: esa.io APIのクライアントとして機能します。esa.ioチームから記事などの情報を取得するために使用され、その情報をGemini Agentのコンテキストとして利用できます。
- **実装**:
    - `src/app/index.ts`: `const esa = new EsaClient(...)`
    - `esa-api-client` ライブラリ