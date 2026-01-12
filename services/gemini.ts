
import { GoogleGenAI, Type } from "@google/genai";
import { generateSystemPrompt } from "../constants";
import { Product } from "../types";

export class SalesAgentService {
  private chat: any;

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      if (error?.message?.includes('400') || error?.message?.includes('expired') || error?.message?.includes('not found')) {
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
      Act as an AI Lead Scraper and Market Intelligence Engine for Gadget Wall (Portugal).
      Current Date: January 2026.
      Query: "${query}"
      Target: Portugal / Europe.

      INSTRUCTIONS:
      1. Use Google Search to find real, active leads from January 2026.
      2. SCRAPE EVERYTHING: Look for publicly available contact details in snippets, descriptions, or forum signatures.
      3. For each lead, try to identify:
         - contactName: Person or business name.
         - email: Publicly listed email (if available).
         - phone: Publicly listed phone number (if available).
         - platform: Where the lead was found (OLX, CustoJusto, Facebook, LinkedIn, Forum, etc.).
         - sourceUrl: The direct link to the post/profile.

      FORMAT:
      Return a JSON object:
      {
        "marketOutlook": "Short trend summary for Jan 2026",
        "leads": [
          {
            "title": "Lead Title",
            "snippet": "Original post content",
            "contactName": "...",
            "email": "...",
            "phone": "...",
            "intentScore": 1-100,
            "fitScore": 1-100,
            "outreachMessage": "Personalized message in ${lang === 'pt' ? 'Portuguese' : 'English'}",
            "platform": "...",
            "sourceUrl": "..." 
          }
        ]
      }

      IMPORTANT: If a specific piece of contact data isn't found, leave it empty. Ensure sourceUrl is ALWAYS populated using the search results.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        parsed = { marketOutlook: "Analysis incomplete.", leads: [] };
      }

      // Ensure every lead has a sourceUrl from grounding if missing
      const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (grounding && Array.isArray(grounding) && parsed.leads) {
        parsed.leads.forEach((res: any, idx: number) => {
          // If the AI didn't provide a direct URL, map it from search grounding
          if (!res.sourceUrl || res.sourceUrl === '...') {
             const chunk = grounding[idx] || grounding[0]; // Fallback to first source if index mismatch
             res.sourceUrl = chunk?.web?.uri || '';
          }
        });
      }
      return parsed;
    } catch (error) {
      console.error("Lead Discovery Error:", error);
      throw error;
    }
  }
}

export const salesService = new SalesAgentService();
