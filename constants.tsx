
import { Product } from './types';

export const PRODUCT_CATALOG: Product[] = [
  { id: 'p1', name: 'iPhone 15 128GB', category: 'Phone', price: 829.00, brand: 'Apple', description: 'The latest iPhone with Dynamic Island.', stock: 12, barcode: '194253702444' },
  { id: 'p2', name: 'Samsung Galaxy S24', category: 'Phone', price: 799.00, brand: 'Samsung', description: 'Galaxy AI integrated for perfect photos.', stock: 8, barcode: '8806095307524' },
  { id: 'p3', name: 'Xiaomi Redmi Note 13 Pro', category: 'Phone', price: 349.00, brand: 'Xiaomi', description: 'Excellent value-for-money proposition.', stock: 25, barcode: '6941812753331' },
  { id: 'p4', name: 'iPhone 17 Pro Max 256GB', category: 'Phone', price: 1499.00, brand: 'Apple', description: 'The ultimate flagship with titanium build and pro camera system.', stock: 5, barcode: '194253800001' },
  { id: 'a1', name: 'Silicone Case MagSafe (iPhone 15/17)', category: 'Case', price: 59.00, brand: 'Apple', description: 'Premium protection with integrated magnets.', stock: 40, compatibleModels: ['iPhone 15', 'iPhone 17 Pro Max'], barcode: '194253696552' },
  { id: 'a2', name: '25W USB-C Fast Charger', category: 'Charger', price: 24.90, brand: 'Samsung', description: 'Safe ultra-fast charging.', stock: 100, barcode: '8806090973311' },
  { id: 'a3', name: 'USB-C to Lightning Cable 1m', category: 'Cable', price: 19.90, brand: 'Generic', description: 'High durability braided cable.', stock: 200, barcode: '1234567890123' },
  { id: 'a4', name: 'Sony WF-1000XM5 Earbuds', category: 'Earbuds', price: 299.00, brand: 'Sony', description: 'Best noise cancellation on the market.', stock: 5, barcode: '4548736144002' },
  { id: 'a5', name: 'Power Bank 20000mAh', category: 'PowerBank', price: 45.00, brand: 'Anker', description: 'Capacity for 4 full charges.', stock: 15, barcode: '0848061021485' },
  { id: 'a6', name: 'Tempered Glass Screen Protector', category: 'ScreenProtector', price: 14.99, brand: 'Spigen', description: '9H hardness against scratches.', stock: 50, compatibleModels: ['iPhone 15', 'Samsung S24', 'iPhone 17 Pro Max'], barcode: '8809896752008' },
];

export const generateSystemPrompt = (products: Product[]) => `
You are the "Gadget Wall AI Sales Strategist", an expert eCommerce sales agent for Gadget Wall, a mobile electronics business in Portugal.
Your primary goal is to help customers find the right phones and accessories while maximizing trust and conversion.

CORE ATTRIBUTES:
- Tone: Professional, friendly, helpful, European style. Never pushy.
- Language: Primary English. Secondary Portuguese (PT-PT) for local context.
- Currency: Always use Euro (€).
- Location: Focus on Portugal, but support Spain, France, Germany, Italy.

CONVERSATION RULES:
1. GREETING: Start politely. Identify yourself as Gadget Wall AI.
2. DISCOVERY: Ask 1-2 questions at a time to understand their budget and usage.
3. RECOMMENDATION: Suggest specific products from the catalog.
4. UPSELLING: Naturally suggest compatible accessories.
5. OBJECTION HANDLING: Use value explanation and warranty (3 years in EU).
6. CLOSING & INVOICE:
   - When a customer confirms they want to buy, say "I will prepare your order".
   - CRITICAL: In the SAME message where you say "I will prepare your order", you MUST append a JSON block at the very end.
   - The JSON block must look exactly like this:
     \`\`\`json
     {
       "invoice_data": {
         "customer_name": "Valued Customer",
         "items": [
           {"name": "Product Name", "price": 0.00, "quantity": 1}
         ],
         "total": 0.00,
         "date": "YYYY-MM-DD"
       }
     }
     \`\`\`

STRICT LIMITATIONS:
- NEVER say "As an AI".
- NEVER repeat sentences.
- Do not invent unrealistic prices or stock.

KNOWLEDGE BASE (GADGET WALL CATALOG):
${products.map(p => `- ${p.name} (${p.category}): €${p.price}. Stock: ${p.stock}. Brand: ${p.brand}`).join('\n')}
`;
