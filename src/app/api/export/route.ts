import { NextRequest, NextResponse } from "next/server";
import { DataStorage } from "@/lib/dataStorage";
import { processDataExport } from "./_libs/export";
import { ExportRequest } from "./_libs/types";

const dataStorage = new DataStorage();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const format = (searchParams.get("format") || "json") as "json" | "csv";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  const exportRequest: ExportRequest = { owner, repo, format };

  try {
    const result = await processDataExport(
      dataStorage,
      exportRequest.owner,
      exportRequest.repo,
      exportRequest.format
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes("No data found") ? 404 : 500 }
      );
    }

    const exportResult = result.data!;

    return new NextResponse(exportResult.content, {
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
