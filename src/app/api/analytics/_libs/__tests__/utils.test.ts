import { describe, it, expect } from "vitest";
import { calculateMergeTime } from "../utils";

describe("calculateMergeTime", () => {
  it("マージされていないPRの場合は0を返す", () => {
    const createdAt = "2023-01-01T10:00:00Z";
    const mergedAt = null;

    const result = calculateMergeTime(createdAt, mergedAt);

    expect(result).toBe(0);
  });

  it("正しくマージ時間を計算する（時間単位）", () => {
    const createdAt = "2023-01-01T10:00:00Z";
    const mergedAt = "2023-01-01T14:00:00Z"; // 4時間後

    const result = calculateMergeTime(createdAt, mergedAt);

    expect(result).toBe(4);
  });

  it("1日後のマージ時間を正しく計算する", () => {
    const createdAt = "2023-01-01T10:00:00Z";
    const mergedAt = "2023-01-02T10:00:00Z"; // 24時間後

    const result = calculateMergeTime(createdAt, mergedAt);

    expect(result).toBe(24);
  });

  it("小数点以下の時間も正しく計算する", () => {
    const createdAt = "2023-01-01T10:00:00Z";
    const mergedAt = "2023-01-01T10:30:00Z"; // 30分後

    const result = calculateMergeTime(createdAt, mergedAt);

    expect(result).toBe(0.5);
  });

  it("異なるタイムゾーンでも正しく計算する", () => {
    const createdAt = "2023-01-01T10:00:00+09:00";
    const mergedAt = "2023-01-01T14:00:00+09:00"; // 4時間後

    const result = calculateMergeTime(createdAt, mergedAt);

    expect(result).toBe(4);
  });
});
