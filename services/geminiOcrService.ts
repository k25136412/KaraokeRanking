import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const modelName = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.0-flash";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface OcrResult {
  score: number;
  songTitle?: string;
}

export const analyzeScoreImage = async (base64Image: string): Promise<OcrResult | null> => {
  if (!apiKey || !genAI) {
    console.error("APIキーが設定されていません。.env ファイルを確認してください。");
    alert("画像解析に失敗しました.\nGemini APIキーが未設定です.\n.env ファイルを確認してください.\n※ 既存の点数データはそのままです.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      このカラオケ採点画面から、点数・曲名・アーティスト名を抽出してください。
      1) 点数は画面上で最も大きい数字を使用
      2) 曲名とアーティスト名は必ず「曲名 / アーティスト名」の形式で返す
      3) 出力は JSON のみ
      4) 例: { "score": 93.598, "songTitle": "曲名 / アーティスト名" }
    `;

    const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/[\s\S]*\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn("Geminiの応答にJSONが含まれていません:", text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0].match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return {
      score: typeof parsed.score === "string" ? Number(parsed.score) : Number(parsed.score ?? 0),
      songTitle: parsed.songTitle || undefined,
    };
  } catch (error: any) {
    console.error("--- OCR解析エラー ---");
    console.error("モデル:", modelName);
    console.error("エラー詳細:", error?.message || error);

    alert(`解析に失敗しました.\n原因: ${error?.message || "不明なエラー"}\n\nAPIキーやモデル名を確認してください。\n※ 既存の点数データはそのままです。`);

    return null;
  }
};
