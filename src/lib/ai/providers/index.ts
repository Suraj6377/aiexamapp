import { AIProvider, GenerateParams } from "./base";
import { GeminiProvider } from "./gemini";
import { OpenAICompatibleProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { AIProviderConfig, AIProviderName } from "@/types/paper";

export class AIProviderRegistry {
  private static providers: Map<AIProviderName, AIProvider> = new Map();

  static initialize() {
    if (this.providers.size > 0) return;

    this.providers.set("gemini", new GeminiProvider());
    this.providers.set(
      "openai",
      new OpenAICompatibleProvider("OpenAI", "https://api.openai.com/v1")
    );
    this.providers.set("anthropic", new AnthropicProvider());
    this.providers.set(
      "groq",
      new OpenAICompatibleProvider("Groq", "https://api.groq.com/openai/v1")
    );
    this.providers.set(
      "openrouter",
      new OpenAICompatibleProvider("OpenRouter", "https://openrouter.ai/api/v1")
    );
    this.providers.set(
      "custom",
      new OpenAICompatibleProvider("Custom Endpoint", "http://localhost:11434/v1")
    );
  }

  static getProvider(name: AIProviderName): AIProvider {
    this.initialize();
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI Provider "${name}" is not supported.`);
    }
    return provider;
  }

  static async generate(config: AIProviderConfig, prompt: string, systemPrompt?: string): Promise<string> {
    const provider = this.getProvider(config.provider);
    const params: GenerateParams = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      prompt,
      systemPrompt,
    };
    return provider.generateText(params);
  }

  static async testConnection(config: Partial<AIProviderConfig>): Promise<{ success: boolean; message: string }> {
    if (!config.provider) {
      return { success: false, message: "No provider selected" };
    }
    if (!config.apiKey && config.provider !== "custom") {
      return { success: false, message: "API key is required" };
    }
    const provider = this.getProvider(config.provider as AIProviderName);
    return provider.testConnection({
      apiKey: config.apiKey || "",
      baseUrl: config.baseUrl,
      model: config.model,
    });
  }
}
