
import { GoogleGenAI, Type } from "@google/genai";
import { generateSystemPrompt } from "../constants";
import { Product } from "../types";

export class SalesAgentService {
  private ai: any;
  private chat: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async startConversation(products: Product[]) {
    const systemInstruction = generateSystemPrompt(products);
    this.chat = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });
  }

  async sendMessage(message: string, currentProducts: Product[]) {
    if (!this.chat) {
      await this.startConversation(currentProducts);
    }
    const response = await this.chat.sendMessage({ message });
    return response.text;
  }

  async discoverLeads(query: string, lang: string) {
    const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const prompt = `
      Act as an AI Lead Discovery Engine for Gadget Wall, a mobile electronics business in Portugal.
      User Query: "${query}"
      Target Language: ${lang}

      Perform the following actions:
      1. Search for potential customers, retail buyers, or B2B shop owners looking for mobile phones or accessories in Europe (focusing on Portugal/Spain).
      2. Analyze search results to identify "High Intent" leads (e.g., social media posts, forum questions, marketplace requests).
      3. For each found lead, provide:
         - A title/name
         - A snippet of their request
         - An "Intent Score" (1-100)
         - A "Fit Score" (1-100) based on Gadget Wall's catalog (phones and accessories)
         - A personalized outreach message in ${lang === 'pt' ? 'Portuguese (PT-PT)' : 'English'}.
      
      Format your response as a JSON array of objects with fields: 
      title, snippet, intentScore, fitScore, outreachMessage, sourceUrl, platform.
      Ensure you extract real URLs from the search results.
    `;

    const response = await aiInstance.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              snippet: { type: Type.STRING },
              intentScore: { type: Type.NUMBER },
              fitScore: { type: Type.NUMBER },
              outreachMessage: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              platform: { type: Type.STRING }
            },
            required: ["title", "snippet", "intentScore", "fitScore", "outreachMessage", "sourceUrl", "platform"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (grounding && Array.isArray(grounding)) {
      results.forEach((res: any, idx: number) => {
        if (!res.sourceUrl && grounding[idx]?.web?.uri) {
          res.sourceUrl = grounding[idx].web.uri;
        }
      });
    }
    return results;
  }
}

export const salesService = new SalesAgentService();
