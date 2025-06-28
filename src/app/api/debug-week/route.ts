import { NextRequest, NextResponse } from "next/server";
import { DataStorage } from "@/lib/dataStorage";
import {
  startOfWeek,
  endOfWeek,
  setISOWeek,
  setYear,
  startOfYear,
} from "date-fns";

const dataStorage = new DataStorage();

// ISO週番号から正確な週の開始日を取得
function getWeekStartFromISOWeek(isoWeekString: string): Date {
  const [year, weekStr] = isoWeekString.split("-W");
  const weekNum = parseInt(weekStr, 10);

  // その年の1月1日から開始
  let date = startOfYear(new Date(parseInt(year, 10), 0, 1));

  // ISO週番号を設定
  date = setISOWeek(date, weekNum);
  date = setYear(date, parseInt(year, 10));

  // 週の開始日（月曜日）を取得
  return startOfWeek(date, { weekStartsOn: 1 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  if (!week) {
    return NextResponse.json(
      { error: "week parameter is required (e.g., 2024-W01)" },
      { status: 400 }
    );
  }

  try {
    // 現在の週と指定された週の情報を取得
    const currentWeek = dataStorage.getCurrentWeek();
    const recentWeeks = dataStorage.getRecentWeeks(10);

    // 指定された週の開始日と終了日を計算
    const weekStart = getWeekStartFromISOWeek(week);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // 現在の週の開始日と終了日も計算
    const currentWeekStart = getWeekStartFromISOWeek(currentWeek);
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    return NextResponse.json({
      query: {
        week,
        currentWeek,
      },
      weekDetails: {
        week,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekStartDate: weekStart.toDateString(),
        weekEndDate: weekEnd.toDateString(),
      },
      currentWeekDetails: {
        week: currentWeek,
        weekStart: currentWeekStart.toISOString(),
        weekEnd: currentWeekEnd.toISOString(),
        weekStartDate: currentWeekStart.toDateString(),
        weekEndDate: currentWeekEnd.toDateString(),
      },
      recentWeeks,
      calculations: {
        daysBetween: Math.floor(
          (weekStart.getTime() - currentWeekStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        isInPast: weekStart < currentWeekStart,
        isInFuture: weekStart > currentWeekStart,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
