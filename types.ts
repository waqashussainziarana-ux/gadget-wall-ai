
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  brand: string;
  description: string;
  stock: number;
  status?: string;
  client?: string;
  notes?: string;
  compatibleModels?: string[];
  serialNumbers?: string[];
  barcode?: string;
  lastAdded?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  customerName: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  date: string;
  status: 'confirmed' | 'pending' | 'shipped';
}

export interface Lead {
  id?: string;
  sourceUrl: string;
  title: string;
  snippet: string;
  intentScore: number;
  fitScore: number;
  outreachMessage: string;
  platform: string;
  email?: string;
  phone?: string;
  contactName?: string;
}

export enum AppTab {
  CHAT = 'chat',
  CATALOG = 'catalog',
  ORDERS = 'orders',
  PROMPT = 'prompt',
  STRATEGY = 'strategy',
  LEAD_GEN = 'lead_gen'
}
