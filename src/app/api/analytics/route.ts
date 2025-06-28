import { NextRequest, NextResponse } from "next/server";
import { DataStorage } from "@/lib/dataStorage";
import { processWeeklyData } from "./_libs/analytics";

// 型定義を再エクスポート
export type {
  MemberStats,
  WeeklyTrend,
  OverallTrend,
  LabelStats,
  AnalyticsResult,
} from "./_libs/types";

const dataStorage = new DataStorage();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  try {
    // 期間が指定されている場合はフィルタリング、そうでなければ全データを取得
    const weeklyDataList =
      from && to
        ? await dataStorage.getDataByDateRange(owner, repo, from, to)
        : await dataStorage.getAllWeeksData(owner, repo);

    if (weeklyDataList.length === 0) {
      return NextResponse.json(
        {
          message:
            "No data found. Please collect data first using /api/collect-data",
          suggestion: "Use POST /api/collect-data to gather weekly data",
          availableWeeks: [],
        },
        { status: 404 }
      );
    }

    console.log(
      `Found ${weeklyDataList.length} weeks of data for ${owner}/${repo}`
    );

    // データを処理して統計を計算
    const analytics = processWeeklyData(weeklyDataList);

    return NextResponse.json({
      repository: { owner, name: repo },
      dataRange: {
        from: weeklyDataList[0]?.week,
        to: weeklyDataList[weeklyDataList.length - 1]?.week,
        totalWeeks: weeklyDataList.length,
      },
      lastUpdated: weeklyDataList[weeklyDataList.length - 1]?.collected_at,
      ...analytics,
    });
  } catch (error) {
    console.error("Error processing analytics:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
