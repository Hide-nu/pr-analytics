import { startOfWeek, endOfWeek } from "date-fns";

/**
 * ISO週番号から正確な週の開始日を取得します
 * @param isoWeekString ISO週番号文字列（例: "2023-W01"）
 * @returns 週の開始日（月曜日）- 日本時間
 */
export function getWeekStartFromISOWeek(isoWeekString: string): Date {
  const [year, weekStr] = isoWeekString.split("-W");
  const yearNum = parseInt(year, 10);
  const weekNum = parseInt(weekStr, 10);

  // 1月4日を含む週が第1週となる（ISO 8601）
  // 日本時間で計算（JST）
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
 * GitHub API検索クエリを生成します
 * @param owner リポジトリオーナー
 * @param repo リポジトリ名
 * @param weekStart 週の開始日
 * @param weekEnd 週の終了日
 * @returns GitHub API検索クエリ文字列
 */
export function buildGitHubSearchQuery(
  owner: string,
  repo: string,
  weekStart: Date,
  weekEnd: Date
): string {
  // 日本時間のDateオブジェクトを正しくYYYY-MM-DD形式に変換
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return `repo:${owner}/${repo} type:pr created:${formatDate(
    weekStart
  )}..${formatDate(weekEnd)}`;
}
