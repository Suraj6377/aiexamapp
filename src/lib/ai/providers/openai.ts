import { AIProvider, GenerateParams } from "./base";

export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  defaultBaseUrl: string;

  constructor(name: string, defaultBaseUrl: string) {
    this.name = name;
    this.defaultBaseUrl = defaultBaseUrl;
  }

  async generateText(params: GenerateParams): Promise<string> {
    const baseUrl = (params.baseUrl || this.defaultBaseUrl).replace(/\/+$/, "");
    const url = `${baseUrl}/chat/completions`;

    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.prompt });

    const body: any = {
      model: params.model,
      messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 4096,
      response_format: { type: "json_object" },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let msg = `${this.name} API Error (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        msg = errJson?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`No content returned by ${this.name}`);
    }
    return content;
  }

  async testConnection(params: { apiKey: string; baseUrl?: string; model?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = (params.baseUrl || this.defaultBaseUrl).replace(/\/+$/, "");

      // For OpenRouter, check key validity via auth/key endpoint
      if (this.name === "OpenRouter" || baseUrl.includes("openrouter.ai")) {
        const authRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: {
            Authorization: `Bearer ${params.apiKey}`,
          },
        });

        if (authRes.ok) {
          const authData = await authRes.json();
          const info = authData?.data;
          const limitStr = info?.limit != null ? ` / Limit: $${info.limit}` : "";
          const usageStr = info?.usage != null ? `Usage: $${Number(info.usage).toFixed(2)}` : "";
          const details = [usageStr, limitStr].filter(Boolean).join("");
          return {
            success: true,
            message: `Connected to OpenRouter! Key is valid${details ? ` (${details})` : ""}.`,
          };
        } else {
          const errText = await authRes.text();
          let errDetail = errText;
          try {
            const errJson = JSON.parse(errText);
            errDetail = errJson?.error?.message || errText;
          } catch {}
          return {
            success: false,
            message: `OpenRouter Key Error (${authRes.status}): ${errDetail.slice(0, 150)}`,
          };
        }
      }

      // Standard OpenAI-compatible test
      const url = `${baseUrl}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model || "gpt-4o-mini",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Status ${res.status}: ${errText.slice(0, 150)}` };
      }
      return { success: true, message: `Connected to ${this.name} successfully!` };
    } catch (err: any) {
      return { success: false, message: err?.message || `Failed to reach ${this.name} endpoint` };
    }
  }
}
