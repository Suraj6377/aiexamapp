import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { AIProviderConfig } from "@/types/paper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configs = StorageService.getAIConfigs();
    // Mask sensitive keys for client display (e.g. "sk-...3a4b")
    const safeConfigs = configs.map((c) => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.slice(0, 4)}••••${c.apiKey.slice(-4)}` : "",
      hasKey: !!c.apiKey && c.apiKey.length > 0,
    }));
    return NextResponse.json({ configs: safeConfigs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AIProviderConfig = await req.json();
    if (!body.id || !body.provider) {
      return NextResponse.json({ error: "Invalid configuration" }, { status: 400 });
    }

    // Preserve existing key if client submitted masked or empty key while already configured
    const existing = StorageService.getAIConfigs().find((c) => c.id === body.id);
    let resolvedKey = body.apiKey;
    if (body.apiKey && body.apiKey.includes("••••") && existing) {
      resolvedKey = existing.apiKey;
    }

    const updatedConfig: AIProviderConfig = {
      ...body,
      apiKey: resolvedKey || (existing ? existing.apiKey : ""),
    };

    StorageService.saveAIConfig(updatedConfig);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
