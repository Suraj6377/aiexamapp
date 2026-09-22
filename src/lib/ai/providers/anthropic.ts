import { AIProvider, GenerateParams } from "./base";

export class AnthropicProvider implements AIProvider {
  name = "anthropic";

  async generateText(params: GenerateParams): Promise<string> {
    const url = "https://api.anthropic.com/v1/messages";

    const body: any = {
      model: params.model || "claude-3-5-sonnet-20241022",
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.3,
      system: (params.systemPrompt || "") + "\nYou MUST return only valid, well-formed JSON without any additional text or commentary.",
      messages: [{ role: "user", content: params.prompt }],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": params.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let msg = `Anthropic API Error (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        msg = errJson?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error("No text returned by Anthropic");
    }
    return text;
  }

  async testConnection(params: { apiKey: string; model?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const url = "https://api.anthropic.com/v1/messages";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": params.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: params.model || "claude-3-haiku-20240307",
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Status ${res.status}: ${errText.slice(0, 150)}` };
      }
      return { success: true, message: "Connected to Anthropic successfully!" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to reach Anthropic endpoint" };
    }
  }
}
