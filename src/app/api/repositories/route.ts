import { NextResponse } from "next/server";
import { DataStorage } from "@/lib/dataStorage";

export async function GET() {
  try {
    const dataStorage = new DataStorage();
    const repositories = await dataStorage.getAvailableRepositories();

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
