import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { ExamTemplate } from "@/types/paper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = StorageService.getTemplates();
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const template: ExamTemplate = await req.json();
    StorageService.saveTemplate(template);
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }
    const removed = StorageService.deleteTemplate(id);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

