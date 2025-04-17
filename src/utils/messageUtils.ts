/**
 * メンションメッセージから質問テキストを抽出する関数
 * "<@ユーザーID> ask 質問内容" から "質問内容" を取得する
 */
export function extractAskText(text: string): string {
  const regex = /(<@[A-Z0-9]+>\s*)(ask)(.*)/i;
  const match = text.match(regex);
  return match ? match[3].trim() : "";
}
