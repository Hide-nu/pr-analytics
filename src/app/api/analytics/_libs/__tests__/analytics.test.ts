import { describe, it, expect } from "vitest";
import { processWeeklyData } from "../analytics";
import { WeeklyPRData } from "@/lib/dataStorage";

// テスト用のモックデータ
const mockWeeklyData: WeeklyPRData[] = [
  {
    week: "2023-01",
    repository: { owner: "test-owner", name: "test-repo" },
    collected_at: "2023-01-07T00:00:00Z",
    prs: [
      {
        id: 1,
        number: 1,
        title: "Test PR 1",
        state: "closed",
        created_at: "2023-01-01T10:00:00Z",
        merged_at: "2023-01-01T14:00:00Z", // 4時間後
        user: {
          login: "user1",
          avatar_url: "https://github.com/user1.png",
        },
        additions: 100,
        deletions: 50,
        changed_files: 5,
        commits: 3,
        comments: 2,
        review_comments: 1,
        reviews: [],
        labels: [
          { name: "bug", color: "red" },
          { name: "frontend", color: "blue" },
        ],
        comment_list: [
          {
            user: {
              login: "user2",
              avatar_url: "https://github.com/user2.png",
            },
          },
        ],
        review_comment_list: [
          {
            user: {
              login: "user3",
              avatar_url: "https://github.com/user3.png",
            },
          },
        ],
      },
      {
        id: 2,
        number: 2,
        title: "Test PR 2",
        state: "open",
        created_at: "2023-01-02T10:00:00Z",
        merged_at: null,
        user: {
          login: "user2",
          avatar_url: "https://github.com/user2.png",
        },
        additions: 200,
        deletions: 100,
        changed_files: 8,
        commits: 5,
        comments: 3,
        review_comments: 2,
        reviews: [],
        labels: [{ name: "feature", color: "green" }],
        comment_list: [
          {
            user: {
              login: "user1",
              avatar_url: "https://github.com/user1.png",
            },
          },
        ],
        review_comment_list: [],
      },
    ],
  },
  {
    week: "2023-02",
    repository: { owner: "test-owner", name: "test-repo" },
    collected_at: "2023-01-14T00:00:00Z",
    prs: [
      {
        id: 3,
        number: 3,
        title: "Test PR 3",
        state: "closed",
        created_at: "2023-01-08T10:00:00Z",
        merged_at: "2023-01-08T18:00:00Z", // 8時間後
        user: {
          login: "user1",
          avatar_url: "https://github.com/user1.png",
        },
        additions: 150,
        deletions: 75,
        changed_files: 3,
        commits: 2,
        comments: 1,
        review_comments: 0,
        reviews: [],
        labels: [{ name: "bug", color: "red" }],
        comment_list: [],
        review_comment_list: [],
      },
    ],
  },
];

describe("processWeeklyData", () => {
  it("週次データから正しくanalytics統計を計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    // 基本的な構造をチェック
    expect(result).toHaveProperty("memberStats");
    expect(result).toHaveProperty("weeklyTrends");
    expect(result).toHaveProperty("overallTrend");
    expect(result).toHaveProperty("labelStats");
  });

  it("メンバー統計を正しく計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    expect(result.memberStats).toHaveLength(2);

    const user1Stats = result.memberStats.find((m) => m.user === "user1");
    const user2Stats = result.memberStats.find((m) => m.user === "user2");

    expect(user1Stats).toBeDefined();
    expect(user2Stats).toBeDefined();

    // user1の統計
    expect(user1Stats!.totalPRs).toBe(2);
    expect(user1Stats!.mergedPRs).toBe(2);
    expect(user1Stats!.openPRs).toBe(0);
    expect(user1Stats!.avgChanges).toBe(187.5); // (150+225)/2 = 375/2 = 187.5
    expect(user1Stats!.avgMergeTime).toBe(6); // (4+8)/2

    // user2の統計
    expect(user2Stats!.totalPRs).toBe(1);
    expect(user2Stats!.mergedPRs).toBe(0);
    expect(user2Stats!.openPRs).toBe(1);
    expect(user2Stats!.avgChanges).toBe(300); // 200+100
  });

  it("週次トレンドを正しく計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    expect(result.weeklyTrends).toHaveLength(2);

    const week1 = result.weeklyTrends.find((w) => w.week === "2023-01");
    const week2 = result.weeklyTrends.find((w) => w.week === "2023-02");

    expect(week1).toBeDefined();
    expect(week2).toBeDefined();

    // 2023-01の統計
    expect(week1!.totalPRs).toBe(2);
    expect(week1!.mergedPRs).toBe(1);
    expect(week1!.avgChanges).toBe(225); // (150+300)/2
    expect(week1!.avgMergeTime).toBe(4); // マージされたPRは1つのみ

    // 2023-02の統計
    expect(week2!.totalPRs).toBe(1);
    expect(week2!.mergedPRs).toBe(1);
    expect(week2!.avgChanges).toBe(225); // 150+75
    expect(week2!.avgMergeTime).toBe(8);
  });

  it("全体統計を正しく計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    expect(result.overallTrend.totalPRs).toBe(3);
    expect(result.overallTrend.mergedPRs).toBe(2);
    expect(result.overallTrend.openPRs).toBe(1);
    expect(result.overallTrend.activeDevelopers).toBe(2);
    expect(result.overallTrend.avgPRsPerWeek).toBe(1.5); // 3/2
    expect(result.overallTrend.mergeRatio).toBe(66.66666666666666); // (2/3)*100
  });

  it("ラベル統計を正しく計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    expect(result.labelStats).toHaveProperty("bug");
    expect(result.labelStats).toHaveProperty("frontend");
    expect(result.labelStats).toHaveProperty("feature");

    expect(result.labelStats.bug.count).toBe(2);
    expect(result.labelStats.bug.color).toBe("red");

    expect(result.labelStats.frontend.count).toBe(1);
    expect(result.labelStats.frontend.color).toBe("blue");

    expect(result.labelStats.feature.count).toBe(1);
    expect(result.labelStats.feature.color).toBe("green");
  });

  it("コメントインタラクションを正しく計算する", () => {
    const result = processWeeklyData(mockWeeklyData);

    const user1Stats = result.memberStats.find((m) => m.user === "user1");
    const user2Stats = result.memberStats.find((m) => m.user === "user2");

    // user1へのインタラクション
    expect(user1Stats!.commentInteractions).toHaveLength(2);
    expect(user1Stats!.commentInteractions[0].user).toBe("user2");
    expect(user1Stats!.commentInteractions[0].count).toBe(1);
    expect(user1Stats!.commentInteractions[1].user).toBe("user3");
    expect(user1Stats!.commentInteractions[1].count).toBe(1);

    // user2へのインタラクション
    expect(user2Stats!.commentInteractions).toHaveLength(1);
    expect(user2Stats!.commentInteractions[0].user).toBe("user1");
    expect(user2Stats!.commentInteractions[0].count).toBe(1);
  });

  it("空のデータに対して適切に処理する", () => {
    const result = processWeeklyData([]);

    expect(result.memberStats).toHaveLength(0);
    expect(result.weeklyTrends).toHaveLength(0);
    expect(result.overallTrend.totalPRs).toBe(0);
    expect(result.overallTrend.activeDevelopers).toBe(0);
    expect(Object.keys(result.labelStats)).toHaveLength(0);
  });

  it("PRがないweekに対して適切に処理する", () => {
    const emptyWeekData: WeeklyPRData[] = [
      {
        week: "2023-01",
        repository: { owner: "test-owner", name: "test-repo" },
        collected_at: "2023-01-07T00:00:00Z",
        prs: [],
      },
    ];

    const result = processWeeklyData(emptyWeekData);

    expect(result.memberStats).toHaveLength(0);
    expect(result.weeklyTrends).toHaveLength(1);
    expect(result.weeklyTrends[0].totalPRs).toBe(0);
    expect(result.weeklyTrends[0].avgChanges).toBe(0);
    expect(result.weeklyTrends[0].avgMergeTime).toBe(0);
  });
});
