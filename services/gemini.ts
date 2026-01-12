
import { GoogleGenAI, Type } from "@google/genai";
import { generateSystemPrompt } from "../constants";
import { Product } from "../types";

export class SalesAgentService {
  private chat: any;

  private getAI() {
    // Note: The API Key is automatically managed via the system environment (process.env.API_KEY).
    // This ensures secure connection to Gemini Pro and Flash models without hardcoding secrets.
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
      Act as an advanced OSINT Lead Discovery & Contact Scraper for Gadget Wall Portugal.
      Context: We are in January 2026.
      Goal: Find specific high-intent sales leads in Portugal/Europe for mobile devices (iPhone 15-17, Samsung S24-26).
      User Query: "${query}"

      SEARCH PROTOCOL:
      1. Scan OLX.pt, CustoJusto, Reddit, Zwame, and social media footprints via Google Search.
      2. TARGET DATA: For every lead found, SCRAPE and prioritize finding:
         - Username/Contact Name
         - Phone Number (look for WhatsApp/Telegram indicators)
         - Email address if present in public text
         - Platform source (e.g. OLX, Twitter, LinkedIn)
         - The direct URL to the lead post

      FORMAT (JSON ONLY):
      {
        "marketOutlook": "Summary of 2026 trends for this query.",
        "leads": [
          {
            "id": "unique-id-123",
            "title": "Lead summary",
            "snippet": "Original post content",
            "contactName": "Name or Username",
            "email": "Email or 'N/A'",
            "phone": "Phone or 'N/A'",
            "platform": "Platform name",
            "sourceUrl": "The direct URL",
            "intentScore": 1-100,
            "fitScore": 1-100,
            "outreachMessage": "Personalized template in ${lang === 'pt' ? 'Portuguese' : 'English'}"
          }
        ]
      }
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

      // GROUNDING: Extract verified source URLs from Google Search metadata if the model output is missing them
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      if (parsed.leads && Array.isArray(parsed.leads)) {
        parsed.leads = parsed.leads.map((lead: any, index: number) => {
          if (!lead.sourceUrl || lead.sourceUrl === '...' || lead.sourceUrl === 'N/A') {
             const chunk = chunks[index] || chunks[0];
             lead.sourceUrl = chunk?.web?.uri || lead.sourceUrl;
          }
          return lead;
        });
      }

      return parsed;
    } catch (error) {
      console.error("Discovery Error:", error);
      throw error;
    }
  }
}

export const salesService = new SalesAgentService();
