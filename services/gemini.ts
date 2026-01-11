
import { GoogleGenAI, Type } from "@google/genai";
import { generateSystemPrompt } from "../constants";
import { Product } from "../types";

export class SalesAgentService {
  private chat: any;

  // Initialize a new instance each time we need one to ensure we have the latest environment state
  // Fix: Strictly follow initialization guideline by using process.env.API_KEY directly
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startConversation(products: Product[]) {
    const ai = this.getAI();
    const systemInstruction = generateSystemPrompt(products);
    this.chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
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
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      // If the chat session is lost or errored, re-start it
      await this.startConversation(currentProducts);
      const retryResponse = await this.chat.sendMessage({ message });
      return retryResponse.text;
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
      // For Search Grounding, we use gemini-3-flash-preview as per text examples
      // We also handle the possibility that response.text is not pure JSON
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || '[]';
      // Attempt to find the JSON block in case there's surrounding text
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
        // Enrich results with grounding URLs if missing
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
