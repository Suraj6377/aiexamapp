import { NextRequest, NextResponse } from "next/server";
import { AIProviderRegistry } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AIProviderRegistry.testConnection(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to test provider connection" },
      { status: 500 }
    );
  }
}
