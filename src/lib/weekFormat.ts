import { startOfWeek, endOfWeek, format } from "date-fns";

/**
 * ISO週番号から正確な週の開始日を取得します
 * @param isoWeekString ISO週番号文字列（例: "2023-W01"）
 * @returns 週の開始日（月曜日）
 */
export function getWeekStartFromISOWeek(isoWeekString: string): Date {
  const [year, weekStr] = isoWeekString.split("-W");
  const yearNum = parseInt(year, 10);
  const weekNum = parseInt(weekStr, 10);

  // 1月4日を含む週が第1週となる（ISO 8601）
  const jan4 = new Date(yearNum, 0, 4, 0, 0, 0, 0);
  const weekStartsOn = 1; // Monday

  // 1月4日を含む週の月曜日を取得
  const firstWeekStart = startOfWeek(jan4, { weekStartsOn });

  // 指定された週数分を加算
  const weekStart = new Date(firstWeekStart);
  weekStart.setDate(firstWeekStart.getDate() + (weekNum - 1) * 7);

  return weekStart;
}

/**
 * ISO週番号から週の終了日を取得します
 * @param isoWeekString ISO週番号文字列（例: "2023-W01"）
 * @returns 週の終了日（日曜日）
 */
export function getWeekEndFromISOWeek(isoWeekString: string): Date {
  const weekStart = getWeekStartFromISOWeek(isoWeekString);
  return endOfWeek(weekStart, { weekStartsOn: 1 });
}

/**
 * ISO週番号を「年の下二桁/MMDD-DD」形式に変換します
 * @param isoWeekString ISO週番号文字列（例: "2024-W27"）
 * @returns フォーマットされた週文字列（例: "24/0701-07"）
 */
export function formatWeekDisplay(isoWeekString: string): string {
  try {
    const weekStart = getWeekStartFromISOWeek(isoWeekString);
    const weekEnd = getWeekEndFromISOWeek(isoWeekString);

    // 年の下二桁を取得
    const yearShort = format(weekStart, "yy");

    // 開始日のMMDD
    const startMMDD = format(weekStart, "MMdd");

    // 終了日のDD
    const endDD = format(weekEnd, "dd");

    return `${yearShort}/${startMMDD}-${endDD}`;
  } catch (error) {
    console.error("週の変換エラー:", error);
    // エラーの場合は元の形式を返す
    return isoWeekString;
  }
}

/**
 * 週データの配列を表示用にフォーマットします
 * @param weeklyData 週データの配列
 * @returns 表示用にフォーマットされた週データの配列
 */
export function formatWeeklyDataForDisplay<T extends { week: string }>(
  weeklyData: T[]
): (T & { weekDisplay: string })[] {
  return weeklyData.map((data) => ({
    ...data,
    weekDisplay: formatWeekDisplay(data.week),
  }));
}
