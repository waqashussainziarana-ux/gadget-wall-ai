
import { GoogleGenAI, Type } from "@google/genai";
import { generateSystemPrompt } from "../constants";
import { Product } from "../types";

export class SalesAgentService {
  private chat: any;

  private getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing. Please set API_KEY environment variable.");
    }
    return new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async startConversation(products: Product[]) {
    try {
      const ai = this.getAI();
      const systemInstruction = generateSystemPrompt(products);
      this.chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });
    } catch (error) {
      console.error("Failed to start Gemini conversation:", error);
      throw error;
    }
  }

  async sendMessage(message: string, currentProducts: Product[]) {
    if (!this.chat) {
      await this.startConversation(currentProducts);
    }
    try {
      const response = await this.chat.sendMessage({ message });
      if (!response || !response.text) {
        throw new Error("Empty response from AI");
      }
      return response.text;
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      
      // If session expired or specific error, attempt one restart
      if (error?.message?.includes('400') || error?.message?.includes('expired')) {
        await this.startConversation(currentProducts);
        const retryResponse = await this.chat.sendMessage({ message });
        return retryResponse.text;
      }
      
      throw error;
    }
  }

  async discoverLeads(query: string, lang: string) {
    const ai = this.getAI();
    
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
      
      IMPORTANT: Return ONLY a valid JSON array of objects.
      Each object must have fields: title, snippet, intentScore, fitScore, outreachMessage, sourceUrl, platform.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || '[]';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      let results = [];
      try {
        results = JSON.parse(jsonStr);
      } catch (e) {
        console.warn("Could not parse leads JSON directly, falling back to empty list.", e);
        results = [];
      }

      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (grounding && Array.isArray(grounding)) {
        results.forEach((res: any, idx: number) => {
          if (!res.sourceUrl && grounding[idx]?.web?.uri) {
            res.sourceUrl = grounding[idx].web.uri;
          }
        });
      }
      return results;
    } catch (error) {
      console.error("Lead Discovery Error:", error);
      throw error;
    }
  }
}

export const salesService = new SalesAgentService();
