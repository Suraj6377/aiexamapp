import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { ExamTemplate } from "@/types/paper";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await StorageService.getTemplates();
    return NextResponse.json({ templates });
  } catch (error: any) {
    safeLogger.error("API:Templates:GET", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const template: ExamTemplate = await req.json();
    if (!template?.id || !template?.name) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }
    await StorageService.saveTemplate(template);
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    safeLogger.error("API:Templates:POST", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to save template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }
    const removed = await StorageService.deleteTemplate(id);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    safeLogger.error("API:Templates:DELETE", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to delete template" }, { status: 500 });
  }
}
