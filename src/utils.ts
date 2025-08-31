/**
 * askコマンドのテキストを抽出
 */
export function extractAskText(text: string): string {
	const match = text.match(/<@\w+>\s+ask\s+([\s\S]+)/i);
	return match ? match[1].trim() : "";
}

/**
 * esa searchコマンドのキーワードを抽出
 */
export function extractEsaSearchKeyword(text: string): string {
	// "esa search" パターン
	const searchMatch = text.match(/<@\w+>\s+esa\s+search\s+([\s\S]+)/i);
	if (searchMatch) return searchMatch[1].trim();
	
	// "esa" のみのパターン（createではない場合は検索とみなす）
	if (!text.includes(" esa create ")) {
		const esaMatch = text.match(/<@\w+>\s+esa\s+([\s\S]+)/i);
		if (esaMatch && !esaMatch[1].trim().startsWith("create")) {
			return esaMatch[1].trim();
		}
	}
	
	return "";
}

/**
 * esa createコマンドのタイトルを抽出
 */
export function extractEsaCreateTitle(text: string): string {
	// "esa create" パターン
	const createMatch = text.match(/<@\w+>\s+esa\s+create\s+([\s\S]+)/i);
	if (createMatch) return createMatch[1].trim();
	
	// "ec" 短縮形パターン
	const ecMatch = text.match(/<@\w+>\s+ec\s+([\s\S]+)/i);
	if (ecMatch) return ecMatch[1].trim();
	
	return "";
}