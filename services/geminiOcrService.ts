import { GoogleGenerativeAI } from "@google/generative-ai";

// .env から設定を読み込み
const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
// .env に VITE_GEMINI_MODEL がない場合は、動作確認済みの 2.5-flash を使います
const modelName = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface OcrResult {
  score: number;
  songTitle?: string;
}

export const analyzeScoreImage = async (base64Image: string): Promise<OcrResult | null> => {
  if (!apiKey) {
    console.error("APIキーが設定されていません。.env ファイルを確認してください。");
    return null;
  }

  try {
    // モデル名を環境変数から取得して設定
    const model = genAI.getGenerativeModel(
      { model: modelName },
      { apiVersion: "v1" }
    );

    // 「曲名 / アーティスト名」の形式で返すようプロンプトを調整
    const prompt = `
      このカラオケ採点画面から「点数」「曲名」「アーティスト名」を抽出してください。
      曲名とアーティスト名は必ず「曲名 / アーティスト名」という形式に結合してください。
      出力は必ず以下のJSON形式のみで返してください。
      { "score": 93.598, "songTitle": "曲名 / アーティスト名" }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: typeof parsed.score === 'string' ? parseFloat(parsed.score) : parsed.score,
        songTitle: parsed.songTitle
      };
    }
    return null;
  } catch (error: any) {
    // 指定された独自の警告メッセージを表示
    const warningMsg = "**モデルが非対応になった可能性があります envファイルを見直してください***";
    console.error("--- OCR解析エラー ---");
    console.error(warningMsg);
    console.error("エラー詳細:", error?.message);
    
    // ユーザー（家族）にも分かりやすいようアラートを表示
    alert(`解析に失敗しました。\n${warningMsg}`);
    
    return null;
  }
};