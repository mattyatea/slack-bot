/**
 * メッセージからコマンドタイプを抽出
 */
export function extractCommandType(text: string): string | null {
	const match = text.match(/<@\w+>\s+(\w+)/);
	return match ? match[1].toLowerCase() : null;
}

/**
 * askコマンドのテキストを抽出
 */
export function extractAskText(text: string): string {
	const match = text.match(/<@\w+>\s+ask\s+([\s\S]+)/i);
	return match ? match[1].trim() : "";
}

/**
 * esaコマンドのタイトルを抽出
 */
export function extractEsaTitle(text: string): string {
	const match = text.match(/<@\w+>\s+esa\s+([\s\S]+)/i);
	return match ? match[1].trim() : "";
}