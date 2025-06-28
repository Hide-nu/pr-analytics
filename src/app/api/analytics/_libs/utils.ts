import { parseISO } from "date-fns";

/**
 * PRの作成日時とマージ日時から、マージまでの時間を計算します（時間単位）
 * @param createdAt PR作成日時（ISO文字列）
 * @param mergedAt PRマージ日時（ISO文字列またはnull）
 * @returns マージまでの時間（時間単位）。マージされていない場合は0
 */
export function calculateMergeTime(
  createdAt: string,
  mergedAt: string | null
): number {
  if (!mergedAt) return 0;
  const created = parseISO(createdAt);
  const merged = parseISO(mergedAt);
  return (merged.getTime() - created.getTime()) / (1000 * 60 * 60); // 時間単位
}
