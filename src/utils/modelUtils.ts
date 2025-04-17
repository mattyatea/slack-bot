import { GeminiModel } from "../services/google";

/**
 * モデルをフィルタリングする関数
 * gemini/gemmaモデルのみを抽出し、除外キーワードに一致するものを除外する
 */
export function filterModels(models: GeminiModel[], searchValue?: string): GeminiModel[] {
  return models
    .filter(model => {
      // モデル名が gemini または gemma を含むもののみ
      const isGeminiOrGemma = model.name.toLowerCase().includes("gemini") ||
        model.name.toLowerCase().includes("gemma");

      // 除外したいキーワード
      const excludedKeywords = ['embedding', 'image', 'vision'];
      const hasExcludedKeyword = excludedKeywords.some(keyword =>
        model.name.toLowerCase().includes(keyword)
      );

      // 検索値があればフィルタリング
      const matchesSearch = !searchValue || 
        model.name.toLowerCase().includes(searchValue.toLowerCase());

      // 条件に合致するモデルのみ残す
      return isGeminiOrGemma && !hasExcludedKeyword && matchesSearch;
    })
    .map((model) => ({
      name: model.name,
      displayName: model.displayName,
      description: model.description,
    }));
}
