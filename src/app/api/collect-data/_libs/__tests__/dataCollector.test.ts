import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchPRsForWeek,
  fetchPRDetail,
  collectWeeklyData,
  checkExistingData,
  saveWeeklyData,
} from "../dataCollector";
import { PRDetail } from "../types";
import { DataStorage } from "@/lib/dataStorage";

// モック用のGitHubクライアント
const createMockGitHubClient = () => ({
  search: {
    issuesAndPullRequests: vi.fn(),
  },
  pulls: {
    get: vi.fn(),
    listReviews: vi.fn(),
    listReviewComments: vi.fn(),
  },
  issues: {
    listComments: vi.fn(),
  },
});

// モック用のDataStorage
const createMockDataStorage = () =>
  ({
    getWeeklyData: vi.fn(),
    saveWeeklyData: vi.fn(),
    getCurrentWeek: vi.fn(),
    getAvailableWeeks: vi.fn(),
    getLastCollectedWeek: vi.fn(),
    getRecentWeeks: vi.fn(),
    getDataByDateRange: vi.fn(),
    getAllWeeksData: vi.fn(),
  } as unknown as DataStorage);

describe("searchPRsForWeek", () => {
  let mockClient: ReturnType<typeof createMockGitHubClient>;

  beforeEach(() => {
    mockClient = createMockGitHubClient();
  });

  it("指定週のPR一覧を正しく検索する", async () => {
    const mockSearchResponse = {
      data: {
        total_count: 2,
        items: [
          { number: 123, pull_request: {} },
          { number: 456, pull_request: {} },
          { number: 789 }, // PRでないissue
        ],
      },
    };

    mockClient.search.issuesAndPullRequests.mockResolvedValue(
      mockSearchResponse
    );

    const result = await searchPRsForWeek(
      mockClient,
      "owner",
      "repo",
      "2023-W01"
    );

    expect(result).toEqual([123, 456]);
    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: "repo:owner/repo type:pr created:2023-01-02..2023-01-08",
      sort: "created",
      order: "desc",
      per_page: 100,
    });
  });

  it("PRが見つからない場合は空配列を返す", async () => {
    const mockSearchResponse = {
      data: {
        total_count: 0,
        items: [],
      },
    };

    mockClient.search.issuesAndPullRequests.mockResolvedValue(
      mockSearchResponse
    );

    const result = await searchPRsForWeek(
      mockClient,
      "owner",
      "repo",
      "2023-W01"
    );

    expect(result).toEqual([]);
  });
});

describe("fetchPRDetail", () => {
  let mockClient: ReturnType<typeof createMockGitHubClient>;

  beforeEach(() => {
    mockClient = createMockGitHubClient();
  });

  it("PR詳細情報を正しく取得する", async () => {
    const mockPRData = {
      id: 123,
      number: 456,
      state: "open",
      created_at: "2023-01-03T10:00:00Z",
      merged_at: null,
      title: "Test PR",
      user: { login: "testuser", avatar_url: "https://example.com/avatar.png" },
      labels: [{ name: "bug", color: "red" }],
      additions: 100,
      deletions: 50,
      changed_files: 3,
      comments: 2,
      review_comments: 1,
      commits: 5,
    };

    mockClient.pulls.get.mockResolvedValue({ data: mockPRData });
    mockClient.pulls.listReviews.mockResolvedValue({ data: [] });
    mockClient.issues.listComments.mockResolvedValue({ data: [] });
    mockClient.pulls.listReviewComments.mockResolvedValue({ data: [] });

    const weekStart = new Date("2023-01-02T00:00:00Z");
    const weekEnd = new Date("2023-01-08T23:59:59Z");

    const result = await fetchPRDetail(
      mockClient,
      "owner",
      "repo",
      456,
      weekStart,
      weekEnd
    );

    expect(result).toEqual({
      id: 123,
      number: 456,
      state: "open",
      created_at: "2023-01-03T10:00:00Z",
      merged_at: null,
      title: "Test PR",
      user: { login: "testuser", avatar_url: "https://example.com/avatar.png" },
      labels: [{ name: "bug", color: "red" }],
      additions: 100,
      deletions: 50,
      changed_files: 3,
      comments: 2,
      review_comments: 1,
      commits: 5,
      reviews: [],
      comment_list: [],
      review_comment_list: [],
    });
  });

  it("週の範囲外のPRはnullを返す", async () => {
    const mockPRData = {
      created_at: "2022-12-25T10:00:00Z", // 範囲外の日付
    };

    mockClient.pulls.get.mockResolvedValue({ data: mockPRData });
    mockClient.pulls.listReviews.mockResolvedValue({ data: [] });
    mockClient.issues.listComments.mockResolvedValue({ data: [] });
    mockClient.pulls.listReviewComments.mockResolvedValue({ data: [] });

    const weekStart = new Date("2023-01-02T00:00:00Z");
    const weekEnd = new Date("2023-01-08T23:59:59Z");

    const result = await fetchPRDetail(
      mockClient,
      "owner",
      "repo",
      456,
      weekStart,
      weekEnd
    );

    expect(result).toBeNull();
  });

  it("APIエラーが発生した場合はnullを返す", async () => {
    mockClient.pulls.get.mockRejectedValue(new Error("API Error"));

    const weekStart = new Date("2023-01-02T00:00:00Z");
    const weekEnd = new Date("2023-01-08T23:59:59Z");

    const result = await fetchPRDetail(
      mockClient,
      "owner",
      "repo",
      456,
      weekStart,
      weekEnd
    );

    expect(result).toBeNull();
  });
});

describe("checkExistingData", () => {
  it("既存データがある場合は返す", async () => {
    const mockDataStorage = createMockDataStorage();
    const mockData = {
      week: "2023-W01",
      repository: { owner: "test", name: "repo" },
      prs: [],
      collected_at: "2023-01-01",
    };

    mockDataStorage.getWeeklyData = vi.fn().mockResolvedValue(mockData);

    const result = await checkExistingData(
      mockDataStorage,
      "test",
      "repo",
      "2023-W01"
    );

    expect(result).toBe(mockData);
    expect(mockDataStorage.getWeeklyData).toHaveBeenCalledWith(
      "test",
      "repo",
      "2023-W01"
    );
  });

  it("既存データがない場合はnullを返す", async () => {
    const mockDataStorage = createMockDataStorage();

    mockDataStorage.getWeeklyData = vi.fn().mockResolvedValue(null);

    const result = await checkExistingData(
      mockDataStorage,
      "test",
      "repo",
      "2023-W01"
    );

    expect(result).toBeNull();
  });
});

describe("saveWeeklyData", () => {
  it("週次データを正しく保存する", async () => {
    const mockDataStorage = createMockDataStorage();
    mockDataStorage.saveWeeklyData = vi.fn().mockResolvedValue(undefined);

    const mockPRDetails: PRDetail[] = [
      {
        id: 123,
        number: 456,
        state: "open",
        created_at: "2023-01-03T10:00:00Z",
        merged_at: null,
        title: "Test PR",
        user: {
          login: "testuser",
          avatar_url: "https://example.com/avatar.png",
        },
        labels: [],
        additions: 100,
        deletions: 50,
        changed_files: 3,
        comments: 2,
        review_comments: 1,
        commits: 5,
        reviews: [],
        comment_list: [],
        review_comment_list: [],
      },
    ];

    const result = await saveWeeklyData(
      mockDataStorage,
      "test",
      "repo",
      "2023-W01",
      mockPRDetails
    );

    expect(result.week).toBe("2023-W01");
    expect(result.repository).toEqual({ owner: "test", name: "repo" });
    expect(result.prs).toBe(mockPRDetails);
    expect(result.collected_at).toBeDefined();
    expect(mockDataStorage.saveWeeklyData).toHaveBeenCalled();
  });
});

describe("collectWeeklyData", () => {
  let mockClient: ReturnType<typeof createMockGitHubClient>;

  beforeEach(() => {
    mockClient = createMockGitHubClient();
  });

  it("週次データ収集を統合的にテストする", async () => {
    // 検索結果のモック
    const mockSearchResponse = {
      data: {
        total_count: 1,
        items: [{ number: 123, pull_request: {} }],
      },
    };

    // PR詳細のモック
    const mockPRData = {
      id: 123,
      number: 123,
      state: "open",
      created_at: "2023-01-03T10:00:00Z", // 週の範囲内に修正
      merged_at: null,
      title: "Test PR",
      user: { login: "testuser", avatar_url: "https://example.com/avatar.png" },
      labels: [],
      additions: 100,
      deletions: 50,
      changed_files: 3,
      comments: 2,
      review_comments: 1,
      commits: 5,
    };

    mockClient.search.issuesAndPullRequests.mockResolvedValue(
      mockSearchResponse
    );
    mockClient.pulls.get.mockResolvedValue({ data: mockPRData });
    mockClient.pulls.listReviews.mockResolvedValue({ data: [] });
    mockClient.issues.listComments.mockResolvedValue({ data: [] });
    mockClient.pulls.listReviewComments.mockResolvedValue({ data: [] });

    const result = await collectWeeklyData(
      mockClient,
      "owner",
      "repo",
      "2023-W01"
    );

    expect(result.prDetails).toHaveLength(1);
    expect(result.totalFound).toBe(1);
    expect(result.processedCount).toBe(1);
    expect(result.prDetails[0].number).toBe(123);
  });
});
