import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { QuestionPaper } from "@/types/paper";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paper = await StorageService.getPaperById(id);
    if (!paper) {
      safeLogger.warn("API:Papers:GET_ID", `Paper ${id} not found`);
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }
    return NextResponse.json({ paper });
  } catch (error: any) {
    safeLogger.error("API:Papers:GET_ID", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to retrieve paper" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paper: QuestionPaper = await req.json();
    if (!paper || !id) {
      return NextResponse.json({ error: "Invalid paper payload" }, { status: 400 });
    }
    paper.id = id;
    await StorageService.savePaper(paper);
    return NextResponse.json({ success: true, paper });
  } catch (error: any) {
    safeLogger.error("API:Papers:PUT", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to update paper" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = await StorageService.deletePaper(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    safeLogger.error("API:Papers:DELETE", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to delete paper" }, { status: 500 });
  }
}
