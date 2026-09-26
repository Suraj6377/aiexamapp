import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { AIProviderConfig } from "@/types/paper";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function maskKey(key?: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export async function GET() {
  try {
    const configs = await StorageService.getAIConfigs();
    const safeConfigs = configs.map((c) => {
      const isGemini = c.provider === "gemini";
      const envKey = isGemini
        ? (process.env.GEMINI_API_KEY || "")
        : (process.env[`${c.provider.toUpperCase()}_API_KEY`] || "");
      const isEnvConfigured = isGemini || Boolean(envKey);
      const hasKey = Boolean((c.apiKey && c.apiKey.trim().length > 0) || envKey);

      return {
        ...c,
        // Hide API key completely for Gemini (secured via .env)
        apiKey: isGemini ? "" : maskKey(c.apiKey),
        hasKey,
        isEnvConfigured,
      };
    });
    return NextResponse.json({ configs: safeConfigs });
  } catch (error: any) {
    safeLogger.error("API:AI:Config:GET", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to load AI configurations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AIProviderConfig = await req.json();
    if (!body?.id || !body?.provider) {
      return NextResponse.json({ error: "Invalid configuration payload" }, { status: 400 });
    }

    const existingConfigs = await StorageService.getAIConfigs();
    const existing = existingConfigs.find((c) => c.id === body.id);

    // Preserve existing real key if client submitted a masked or empty key
    let resolvedKey = body.apiKey;
    if (resolvedKey && resolvedKey.includes("••••")) {
      resolvedKey = existing?.apiKey || "";
    }
    if (!resolvedKey && existing?.apiKey) {
      resolvedKey = existing.apiKey;
    }
    if (!resolvedKey && body.provider === "gemini") {
      resolvedKey = process.env.GEMINI_API_KEY || "";
    }

    const updatedConfig: AIProviderConfig = {
      ...body,
      apiKey: resolvedKey || "",
    };

    // If activating this provider, mark others as inactive
    if (updatedConfig.isActive) {
      for (const other of existingConfigs) {
        if (other.id !== updatedConfig.id && other.isActive) {
          await StorageService.saveAIConfig({ ...other, isActive: false });
        }
      }
    }

    await StorageService.saveAIConfig(updatedConfig);
    safeLogger.info("API:AI:Config:POST", `Saved AI configuration for ${updatedConfig.name} (${updatedConfig.provider})`);

    // Return masked key to never expose secret
    return NextResponse.json({
      success: true,
      config: {
        ...updatedConfig,
        apiKey: updatedConfig.provider === "gemini" ? "" : maskKey(updatedConfig.apiKey),
        hasKey: Boolean(updatedConfig.apiKey && updatedConfig.apiKey.trim().length > 0),
        isEnvConfigured: updatedConfig.provider === "gemini" || Boolean(process.env[`${updatedConfig.provider.toUpperCase()}_API_KEY`]),
      },
    });
  } catch (error: any) {
    safeLogger.error("API:AI:Config:POST", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to save AI configuration" }, { status: 500 });
  }
}
