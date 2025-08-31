type commendType = "ask" | "esa" | "none";
/**
 * メンションメッセージから質問テキストを抽出する関数
 * "<@ユーザーID> ask 質問内容" から "質問内容" を取得する
 */
export function extractAskText(text: string): string {
	const regex = /(<@[A-Z0-9]+>\s*)(ask)(.*)/i;
	const match = text.match(regex);
	return match ? match[3].trim() : "";
}

export function extractEsaTitle(text: string): string {
	const regex = /(<@[A-Z0-9]+>\s*)(esa)(.*)/i;
	const match = text.match(regex);
	return match ? match[3].trim() : "";
}

export function extractCommandType(text: string): commendType {
	const regex = /(<@[A-Z0-9]+>\s*)(ask|esa)(.*)/i;
	const match = text.match(regex);
	if (match) {
		return match[2] as commendType;
	}
	return "none";
}
