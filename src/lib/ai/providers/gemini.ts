import { AIProvider, GenerateParams } from "./base";

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateText(params: GenerateParams): Promise<string> {
    const model = params.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

    const body: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        temperature: params.temperature ?? 0.3,
        maxOutputTokens: params.maxTokens ?? 8192,
        responseMimeType: "application/json",
      },
    };

    if (params.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: params.systemPrompt }],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      let msg = `Gemini API Error (${res.status})`;
      try {
        const errJson = JSON.parse(errorText);
        msg = errJson?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No text returned by Gemini");
    }
    return text;
  }

  async testConnection(params: { apiKey: string; model?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const model = params.model || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond with: ok" }] }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = errText;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.message || errText;
        } catch {}
        return { success: false, message: `Status ${res.status}: ${errMsg.slice(0, 150)}` };
      }
      return { success: true, message: `Connected to Google Gemini (${model}) successfully!` };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to reach Gemini API" };
    }
  }
}
