import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { QuestionPaper } from "@/types/paper";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const papers = await StorageService.getPapers();
    return NextResponse.json({ papers });
  } catch (error: any) {
    safeLogger.error("API:Papers:GET", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to load papers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const paper: QuestionPaper = await req.json();
    if (!paper?.id) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }
    await StorageService.savePaper(paper);
    return NextResponse.json({ success: true, paper });
  } catch (error: any) {
    safeLogger.error("API:Papers:POST", error.message, error);
    return NextResponse.json({ error: error?.message || "Failed to save paper" }, { status: 500 });
  }
}
