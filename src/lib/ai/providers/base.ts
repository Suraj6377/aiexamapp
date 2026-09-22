export interface GenerateParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface AIProvider {
  name: string;
  generateText(params: GenerateParams): Promise<string>;
  testConnection(params: { apiKey: string; baseUrl?: string; model?: string }): Promise<{ success: boolean; message: string }>;
}
