import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { QuestionPaper } from "@/types/paper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const papers = StorageService.getPapers();
    return NextResponse.json({ papers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const paper: QuestionPaper = await req.json();
    StorageService.savePaper(paper);
    return NextResponse.json({ success: true, paper });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
