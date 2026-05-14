import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface HealthReport {
  species: string;
  health_score: number;
  observations: string;
  recommended_action: string;
}

export const analyzeAnimalHealth = async (base64Image: string): Promise<HealthReport> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Perform a Visual Health Audit on this farm animal. Detect the species and check for gait, skin/feather condition, and energy levels. Return a JSON response.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          species: { type: Type.STRING },
          health_score: { type: Type.NUMBER, description: "Scale 0-100" },
          observations: { type: Type.STRING },
          recommended_action: { type: Type.STRING }
        },
        required: ["species", "health_score", "observations", "recommended_action"]
      }
    }
  });

  return JSON.parse(response.text) as HealthReport;
};

export const getGeminiLiveSession = (callbacks: any) => {
  return ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    callbacks,
    config: {
      systemInstruction: "You are OmniFarm Guardian's voice assistant. You have access to the animal's history. Speak clearly and concisely about the animal's records when asked."
    }
  });
};
