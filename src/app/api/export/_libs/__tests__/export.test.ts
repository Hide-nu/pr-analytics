import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enrichPRsWithWeekInfo,
  calculateDataRange,
  calculateExportSummary,
  buildExportData,
  exportAsJSON,
  exportAsCSV,
  exportData,
  processDataExport,
} from "../export";
import { WeeklyPRData, DataStorage } from "@/lib/dataStorage";
import { EnrichedPR } from "../types";

// DataStorageのモック型
interface MockDataStorage {
  getAllWeeksData: (owner: string, repo: string) => Promise<WeeklyPRData[]>;
}

// テスト用のモックデータ
const mockPR = {
  id: 1,
  number: 123,
  state: "closed" as "open" | "closed",
  created_at: "2023-01-05T10:00:00Z",
  merged_at: "2023-01-06T15:30:00Z",
  title: "Fix bug",
  user: {
    login: "developer1",
    avatar_url: "https://example.com/avatar1.jpg",
  },
  labels: [
    { name: "bug", color: "red" },
    { name: "priority", color: "orange" },
  ],
  additions: 10,
  deletions: 5,
  changed_files: 2,
  comments: 1,
  review_comments: 0,
  commits: 1,
  reviews: [],
  comment_list: [],
  review_comment_list: [],
};

const mockWeeklyData: WeeklyPRData[] = [
  {
    week: "2023-W01",
    repository: { owner: "testowner", name: "testrepo" },
    prs: [mockPR],
    collected_at: "2023-01-10T10:00:00Z",
  },
  {
    week: "2023-W02",
    repository: { owner: "testowner", name: "testrepo" },
    prs: [
      {
        ...mockPR,
        id: 2,
        number: 124,
        state: "open" as "open" | "closed",
        merged_at: null,
        user: { login: "developer2", avatar_url: "" },
        additions: 20,
        deletions: 0,
      },
    ],
    collected_at: "2023-01-17T10:00:00Z",
  },
];

describe("enrichPRsWithWeekInfo", () => {
  it("週次データからPRを統合して拡張情報を付与する", () => {
    const result = enrichPRsWithWeekInfo(mockWeeklyData);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      ...mockPR,
      week: "2023-W01",
      collected_at: "2023-01-10T10:00:00Z",
    });
    expect(result[1]).toMatchObject({
      number: 124,
      week: "2023-W02",
      collected_at: "2023-01-17T10:00:00Z",
    });
  });

  it("空配列の場合は空配列を返す", () => {
    const result = enrichPRsWithWeekInfo([]);
    expect(result).toEqual([]);
  });
});

describe("calculateDataRange", () => {
  it("データ範囲情報を正しく計算する", () => {
    const result = calculateDataRange(mockWeeklyData);

    expect(result).toEqual({
      from: "2023-W01",
      to: "2023-W02",
      totalWeeks: 2,
    });
  });

  it("単一週のデータでも正しく処理する", () => {
    const singleWeekData = [mockWeeklyData[0]];
    const result = calculateDataRange(singleWeekData);

    expect(result).toEqual({
      from: "2023-W01",
      to: "2023-W01",
      totalWeeks: 1,
    });
  });

  it("空配列の場合はエラーを投げる", () => {
    expect(() => calculateDataRange([])).toThrow("No weekly data provided");
  });
});

describe("calculateExportSummary", () => {
  it("エクスポートサマリーを正しく計算する", () => {
    const enrichedPRs: EnrichedPR[] = [
      {
        ...mockPR,
        week: "2023-W01",
        collected_at: "2023-01-10T10:00:00Z",
        state: "closed",
        merged_at: "2023-01-06T15:30:00Z",
        user: { login: "dev1", avatar_url: "" },
        additions: 10,
        deletions: 5,
      },
      {
        ...mockPR,
        id: 2,
        number: 124,
        week: "2023-W02",
        collected_at: "2023-01-17T10:00:00Z",
        state: "open",
        merged_at: null,
        user: { login: "dev2", avatar_url: "" },
        additions: 20,
        deletions: 0,
      },
    ];

    const result = calculateExportSummary(enrichedPRs);

    expect(result).toEqual({
      totalPRs: 2,
      mergedPRs: 1,
      openPRs: 1,
      totalChanges: 35, // 10+5+20+0
      uniqueContributors: 2,
    });
  });

  it("空配列の場合は全てゼロを返す", () => {
    const result = calculateExportSummary([]);

    expect(result).toEqual({
      totalPRs: 0,
      mergedPRs: 0,
      openPRs: 0,
      totalChanges: 0,
      uniqueContributors: 0,
    });
  });
});

describe("buildExportData", () => {
  beforeEach(() => {
    // Dateオブジェクトをモック
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-20T12:00:00Z"));
  });

  it("エクスポートデータを正しく構築する（allPRs含む）", () => {
    const result = buildExportData("owner", "repo", mockWeeklyData, true);

    expect(result.repository).toEqual({ owner: "owner", name: "repo" });
    expect(result.exportedAt).toBe("2023-01-20T12:00:00.000Z");
    expect(result.dataRange).toEqual({
      from: "2023-W01",
      to: "2023-W02",
      totalWeeks: 2,
    });
    expect(result.summary.totalPRs).toBe(2);
    expect(result.weeklyData).toEqual(mockWeeklyData);
    expect(result.allPRs).toHaveLength(2);
  });

  it("エクスポートデータを正しく構築する（allPRs除外）", () => {
    const result = buildExportData("owner", "repo", mockWeeklyData, false);

    expect(result.allPRs).toBeUndefined();
    expect(result.weeklyData).toEqual(mockWeeklyData);
  });
});

describe("exportAsJSON", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-20T12:00:00Z"));
  });

  it("JSON形式でエクスポートする", () => {
    const result = exportAsJSON("microsoft", "vscode", mockWeeklyData);

    expect(result.filename).toBe("microsoft-vscode-pr-analytics.json");
    expect(result.contentType).toBe("application/json");

    const parsedContent = JSON.parse(result.content);
    expect(parsedContent.repository).toEqual({
      owner: "microsoft",
      name: "vscode",
    });
    expect(parsedContent.allPRs).toHaveLength(2);
  });
});

describe("exportAsCSV", () => {
  it("CSV形式でエクスポートする", () => {
    const result = exportAsCSV("facebook", "react", mockWeeklyData);

    expect(result.filename).toBe("facebook-react-pr-analytics.csv");
    expect(result.contentType).toBe("text/csv");
    expect(result.content).toContain("week,pr_number,title");
    expect(result.content).toContain("2023-W01,123");
    expect(result.content).toContain("2023-W02,124");
  });
});

describe("exportData", () => {
  it("JSON形式を指定した場合はJSONエクスポートを返す", () => {
    const result = exportData("owner", "repo", mockWeeklyData, "json");

    expect(result.filename).toBe("owner-repo-pr-analytics.json");
    expect(result.contentType).toBe("application/json");
  });

  it("CSV形式を指定した場合はCSVエクスポートを返す", () => {
    const result = exportData("owner", "repo", mockWeeklyData, "csv");

    expect(result.filename).toBe("owner-repo-pr-analytics.csv");
    expect(result.contentType).toBe("text/csv");
  });
});

describe("processDataExport", () => {
  it("データが存在する場合は正常にエクスポートする", async () => {
    const mockDataStorage: MockDataStorage = {
      getAllWeeksData: vi.fn().mockResolvedValue(mockWeeklyData),
    };

    const result = await processDataExport(
      mockDataStorage as DataStorage,
      "owner",
      "repo",
      "json"
    );

    expect(result.success).toBe(true);
    expect(result.data?.filename).toBe("owner-repo-pr-analytics.json");
    expect(result.error).toBeUndefined();
  });

  it("データが存在しない場合はエラーを返す", async () => {
    const mockDataStorage: MockDataStorage = {
      getAllWeeksData: vi.fn().mockResolvedValue([]),
    };

    const result = await processDataExport(
      mockDataStorage as DataStorage,
      "owner",
      "repo",
      "csv"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "No data found. Please collect data first using /api/collect-data"
    );
    expect(result.data).toBeUndefined();
  });

  it("エラーが発生した場合は適切に処理する", async () => {
    const mockDataStorage: MockDataStorage = {
      getAllWeeksData: vi.fn().mockRejectedValue(new Error("Database error")),
    };

    const result = await processDataExport(
      mockDataStorage as DataStorage,
      "owner",
      "repo"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database error");
    expect(result.data).toBeUndefined();
  });
});
