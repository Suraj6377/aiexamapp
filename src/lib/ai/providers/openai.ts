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
    const isOpenRouter = this.name === "OpenRouter" || baseUrl.includes("openrouter.ai");

    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.prompt });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    };

    if (isOpenRouter) {
      headers["HTTP-Referer"] = "https://aiexamapp.vercel.app";
      headers["X-Title"] = "AI Exam Paper Generator";
    }

    // Prepare candidate models for OpenRouter free tier fallback
    const candidateModels: string[] = [params.model];
    if (isOpenRouter) {
      const freeFallbacks = [
        "liquid/lfm-2.5-2.6b:free",
        "nex-agi/nex-n2.5-mini:free",
        "nex-agi/nex-n2.5-pro:free",
        "google/gemma-4-31b-it:free",
      ];
      for (const fb of freeFallbacks) {
        if (!candidateModels.includes(fb)) {
          candidateModels.push(fb);
        }
      }
    }

    let lastError: Error | null = null;

    for (const modelToTry of candidateModels) {
      try {
        const body: any = {
          model: modelToTry,
          messages,
          temperature: params.temperature ?? 0.3,
          max_tokens: Math.max(params.maxTokens ?? 4096, 6144),
        };

        // Only enforce response_format for official OpenAI models
        if (this.name === "OpenAI" && !isOpenRouter) {
          body.response_format = { type: "json_object" };
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          let msg = `${this.name} API Error (${res.status})`;
          try {
            const errJson = JSON.parse(errorText);
            msg = errJson?.error?.metadata?.raw || errJson?.error?.message || msg;
          } catch {}

          // If rate-limited (429) or provider error, try next candidate model
          if (res.status === 429 || res.status === 502 || res.status === 503 || msg.includes("Provider returned error") || msg.includes("rate-limit")) {
            console.warn(`[OpenAICompatibleProvider] Model ${modelToTry} rate-limited/failed: ${msg}. Trying next candidate...`);
            lastError = new Error(msg);
            continue;
          }
          throw new Error(msg);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content || content.trim().length === 0) {
          // If empty content (e.g. reasoning model exhausted tokens), try next candidate
          console.warn(`[OpenAICompatibleProvider] Model ${modelToTry} returned empty content. Trying fallback...`);
          lastError = new Error(`No content returned by model ${modelToTry}`);
          continue;
        }

        return content;
      } catch (err: any) {
        lastError = err;
        // If not a network/model issue, rethrow
        if (!isOpenRouter) throw err;
      }
    }

    throw lastError || new Error(`No content returned by ${this.name}`);
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
