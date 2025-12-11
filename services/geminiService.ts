import { GoogleGenAI } from "@google/genai";
import { RankingItem } from "../types";

// NOTE: In a real client-side deployment where the user wants to keep it local,
// we might need to ask the user for a key via UI. 
// However, per system instructions, we use process.env.API_KEY.
// We will wrap this in a try-catch to handle missing keys gracefully in the UI.

export const generateSessionSummary = async (ranking: RankingItem[], sessionName: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "APIキーが設定されていないため、AIコメントを生成できません。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare data for the prompt
    const rankingText = ranking.map(r => 
      `${r.rank}位: ${r.name} (スコア: ${r.finalScore}点 / 平均: ${r.average}点 / ハンデ: ${r.handicap})`
    ).join('\n');

    const prompt = `
      あなたはプロのカラオケ大会の実況アナウンサーです。
      以下のカラオケ大会「${sessionName}」の結果をもとに、短く情熱的で面白い総評コメントを書いてください。
      
      【ルール】
      ・1人3曲歌った平均点＋ハンデで順位が決まっています。
      ・優勝者を称え、下位の人も励ましてください。
      ・200文字以内でお願いします。

      【ランキング結果】
      ${rankingText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "コメントの生成に失敗しました。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AIコメントの生成中にエラーが発生しました。通信環境やAPIキーを確認してください。";
  }
};