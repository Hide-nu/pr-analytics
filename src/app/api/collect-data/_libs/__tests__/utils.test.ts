import { describe, it, expect } from "vitest";
import {
  getWeekStartFromISOWeek,
  getWeekEndFromISOWeek,
  buildGitHubSearchQuery,
} from "../utils";

describe("getWeekStartFromISOWeek", () => {
  it("正しく週の開始日を計算する（月曜日）", () => {
    const result = getWeekStartFromISOWeek("2023-W01");

    // 2023年の第1週は1月2日（月曜日）から開始
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(0); // 0 = January
    expect(result.getDate()).toBe(2);
    expect(result.getDay()).toBe(1); // 1 = Monday
  });

  it("年末の週を正しく処理する", () => {
    const result = getWeekStartFromISOWeek("2023-W52");

    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11); // 11 = December
    expect(result.getDate()).toBe(25); // 12月25日
    expect(result.getDay()).toBe(1); // Monday
  });

  it("年始の週を正しく処理する", () => {
    const result = getWeekStartFromISOWeek("2024-W01");

    expect(result.getFullYear()).toBe(2024);
    expect(result.getDay()).toBe(1); // Monday
  });
});

describe("getWeekEndFromISOWeek", () => {
  it("正しく週の終了日を計算する（日曜日）", () => {
    const result = getWeekEndFromISOWeek("2023-W01");

    // 週の終了日は日曜日
    expect(result.getDay()).toBe(0); // 0 = Sunday
    expect(result.getFullYear()).toBe(2023);
  });

  it("週の開始日から6日後になる", () => {
    const weekStart = getWeekStartFromISOWeek("2023-W10");
    const weekEnd = getWeekEndFromISOWeek("2023-W10");

    const diffInDays =
      (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffInDays)).toBe(7); // 月曜日0:00から日曜日23:59まで約6.999日
  });
});

describe("buildGitHubSearchQuery", () => {
  it("正しいGitHub検索クエリを生成する", () => {
    // 日本時間でDateオブジェクトを作成
    const weekStart = new Date(2023, 0, 2); // 2023年1月2日
    const weekEnd = new Date(2023, 0, 8); // 2023年1月8日

    const result = buildGitHubSearchQuery("owner", "repo", weekStart, weekEnd);

    expect(result).toBe(
      "repo:owner/repo type:pr created:2023-01-02..2023-01-08"
    );
  });

  it("異なるリポジトリでも正しく動作する", () => {
    // 日本時間でDateオブジェクトを作成
    const weekStart = new Date(2023, 5, 5); // 2023年6月5日
    const weekEnd = new Date(2023, 5, 11); // 2023年6月11日

    const result = buildGitHubSearchQuery(
      "microsoft",
      "vscode",
      weekStart,
      weekEnd
    );

    expect(result).toBe(
      "repo:microsoft/vscode type:pr created:2023-06-05..2023-06-11"
    );
  });

  it("日付フォーマットが正しい（YYYY-MM-DD）", () => {
    // 日本時間でDateオブジェクトを作成
    const weekStart = new Date(2023, 11, 4); // 2023年12月4日
    const weekEnd = new Date(2023, 11, 10); // 2023年12月10日

    const result = buildGitHubSearchQuery("test", "repo", weekStart, weekEnd);

    expect(result).toContain("created:2023-12-04..2023-12-10");
  });
});
