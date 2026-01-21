
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData, Strategy } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeTopic = async (topic: string, region: string = "South Korea"): Promise<AnalysisData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the YouTube topic/niche: "${topic}" in region: "${region}". 
    Provide a detailed breakdown of market statistics, top competitor examples, key insights, and comparative strategies (General vs Niche).
    
    CRITICAL RULES:
    1. All text fields in the JSON response MUST be in Korean (한국어).
    2. For every strategy, especially 'niche' type, you MUST provide EXACTLY 5 high-quality, creative content ideas.
    3. Ensure the CPM range reflects current market data for ${region}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          region: { type: Type.STRING },
          category: { type: Type.STRING },
          cpmRange: { type: Type.STRING },
          stats: {
            type: Type.OBJECT,
            properties: {
              relatedChannels: { type: Type.STRING },
              relatedVideos: { type: Type.STRING },
              avgSubscribers: { type: Type.STRING },
              competitionIntensity: { type: Type.STRING, description: "낮음, 보통, 높음" }
            },
            required: ["relatedChannels", "relatedVideos", "avgSubscribers", "competitionIntensity"]
          },
          topChannels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                subscribers: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["name", "subscribers", "url"]
            }
          },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          strategies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "general or niche" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                competition: { type: Type.STRING, description: "낮음, 보통, 높음" },
                difficulty: { type: Type.NUMBER },
                estimatedCpm: { type: Type.STRING },
                ideas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["type", "title", "description", "competition", "difficulty", "estimatedCpm", "ideas"]
            }
          }
        },
        required: ["region", "category", "cpmRange", "stats", "topChannels", "insights", "strategies"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid analysis data returned from AI");
  }
};

export const refreshNicheStrategy = async (topic: string, region: string): Promise<Strategy> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the YouTube topic "${topic}" in "${region}", generate a NEW and highly specific 'niche' strategy.
    The strategy should target a very specific segment of the audience to minimize competition.
    Provide EXACTLY 5 unique and actionable content ideas.
    All response text must be in Korean (한국어).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["niche"] },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          competition: { type: Type.STRING },
          difficulty: { type: Type.NUMBER },
          estimatedCpm: { type: Type.STRING },
          ideas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["type", "title", "description", "competition", "difficulty", "estimatedCpm", "ideas"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse refresh response:", error);
    throw new Error("Failed to generate niche refresh");
  }
};
