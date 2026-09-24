import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let { provider, apiKey, baseUrl } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    // Resolve unmasked API key from storage or env if client sent masked key
    let resolvedApiKey = apiKey;
    if (!resolvedApiKey || resolvedApiKey.includes("••••")) {
      try {
        const { StorageService } = await import("@/lib/storage");
        const serverConfigs = await StorageService.getAIConfigs();
        const matched = serverConfigs.find((c) => c.provider === provider);
        if (matched?.apiKey && !matched.apiKey.includes("••••")) {
          resolvedApiKey = matched.apiKey;
        }
      } catch {}
    }
    if (!resolvedApiKey || resolvedApiKey.includes("••••")) {
      if (provider === "openrouter") resolvedApiKey = process.env.OPENROUTER_API_KEY || "";
      if (provider === "gemini") resolvedApiKey = process.env.GEMINI_API_KEY || "";
      if (provider === "openai") resolvedApiKey = process.env.OPENAI_API_KEY || "";
      if (provider === "anthropic") resolvedApiKey = process.env.ANTHROPIC_API_KEY || "";
      if (provider === "groq") resolvedApiKey = process.env.GROQ_API_KEY || "";
    }

    // 1. OpenRouter Models
    if (provider === "openrouter" || (baseUrl && baseUrl.includes("openrouter.ai"))) {
      const headers: Record<string, string> = {};
      if (resolvedApiKey && !resolvedApiKey.includes("••••")) {
        headers["Authorization"] = `Bearer ${resolvedApiKey}`;
      }

      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `OpenRouter returned status ${res.status}: ${errText.slice(0, 150)}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      const rawModels: any[] = data?.data || [];

      // Sort models: popular/high-quality models first
      const formattedModels = rawModels.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        contextLength: m.context_length || 0,
        promptPrice: m.pricing?.prompt ? (Number(m.pricing.prompt) * 1000000).toFixed(2) : null,
        completionPrice: m.pricing?.completion ? (Number(m.pricing.completion) * 1000000).toFixed(2) : null,
        description: m.description || "",
      }));

      return NextResponse.json({
        success: true,
        provider: "openrouter",
        count: formattedModels.length,
        models: formattedModels,
      });
    }

    // 2. Google Gemini Models
    if (provider === "gemini") {
      if (!apiKey) {
        return NextResponse.json({ error: "Gemini API key is required" }, { status: 400 });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Gemini returned status ${res.status}: ${errText.slice(0, 150)}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      const rawModels: any[] = data?.models || [];
      const formattedModels = rawModels
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => ({
          id: m.name.replace(/^models\//, ""),
          name: m.displayName || m.name.replace(/^models\//, ""),
          contextLength: m.inputTokenLimit || 0,
          description: m.description || "",
        }));

      return NextResponse.json({
        success: true,
        provider: "gemini",
        count: formattedModels.length,
        models: formattedModels,
      });
    }

    // 3. OpenAI / Groq / Custom Endpoint Models
    const targetBaseUrl = (
      baseUrl ||
      (provider === "groq"
        ? "https://api.groq.com/openai/v1"
        : "https://api.openai.com/v1")
    ).replace(/\/+$/, "");

    if (!apiKey && provider !== "custom") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${targetBaseUrl}/models`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `${provider} returned status ${res.status}: ${errText.slice(0, 150)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawModels: any[] = data?.data || [];
    const formattedModels = rawModels.map((m: any) => ({
      id: m.id,
      name: m.id,
      contextLength: 0,
      description: "",
    }));

    return NextResponse.json({
      success: true,
      provider,
      count: formattedModels.length,
      models: formattedModels,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch models" },
      { status: 500 }
    );
  }
}
