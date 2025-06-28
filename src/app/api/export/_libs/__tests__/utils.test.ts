import { describe, it, expect } from "vitest";
import {
  escapeCSVField,
  generateCSVHeaders,
  convertPRToCSVRow,
  generateCSVContent,
  generateCSVExport,
  generateFilename,
  calculateUniqueContributors,
  calculateTotalChanges,
} from "../utils";
import { EnrichedPR } from "../types";

describe("escapeCSVField", () => {
  it("ダブルクォートを正しくエスケープする", () => {
    const input = 'Fix "bug" in component';
    const result = escapeCSVField(input);
    expect(result).toBe('"Fix ""bug"" in component"');
  });

  it("ダブルクォートがない場合も正しく処理する", () => {
    const input = "Fix bug in component";
    const result = escapeCSVField(input);
    expect(result).toBe('"Fix bug in component"');
  });

  it("空文字列を正しく処理する", () => {
    const input = "";
    const result = escapeCSVField(input);
    expect(result).toBe('""');
  });
});

describe("generateCSVHeaders", () => {
  it("正しいCSVヘッダーを生成する", () => {
    const headers = generateCSVHeaders();
    expect(headers).toEqual([
      "week",
      "pr_number",
      "title",
      "state",
      "user",
      "created_at",
      "merged_at",
      "additions",
      "deletions",
      "changed_files",
      "comments",
      "review_comments",
      "commits",
      "labels",
    ]);
  });
});

describe("convertPRToCSVRow", () => {
  it("PRを正しくCSV行に変換する", () => {
    const pr: EnrichedPR = {
      week: "2023-W01",
      collected_at: "2023-01-10T10:00:00Z",
      id: 1,
      number: 123,
      state: "closed" as "open" | "closed",
      created_at: "2023-01-05T10:00:00Z",
      merged_at: "2023-01-06T15:30:00Z",
      title: 'Fix "critical" bug',
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
      comments: 3,
      review_comments: 1,
      commits: 2,
      reviews: [],
      comment_list: [],
      review_comment_list: [],
    };

    const result = convertPRToCSVRow(pr);
    expect(result).toEqual([
      "2023-W01",
      "123",
      '"Fix ""critical"" bug"',
      "closed",
      "developer1",
      "2023-01-05T10:00:00Z",
      "2023-01-06T15:30:00Z",
      "10",
      "5",
      "2",
      "3",
      "1",
      "2",
      '"bug;priority"',
    ]);
  });

  it("nullのmerged_atを正しく処理する", () => {
    const pr: EnrichedPR = {
      week: "2023-W01",
      collected_at: "2023-01-10T10:00:00Z",
      id: 1,
      number: 456,
      state: "open" as "open" | "closed",
      created_at: "2023-01-05T10:00:00Z",
      merged_at: null,
      title: "Add new feature",
      user: {
        login: "developer2",
        avatar_url: "https://example.com/avatar2.jpg",
      },
      labels: [],
      additions: 20,
      deletions: 0,
      changed_files: 3,
      comments: 0,
      review_comments: 0,
      commits: 1,
      reviews: [],
      comment_list: [],
      review_comment_list: [],
    };

    const result = convertPRToCSVRow(pr);
    expect(result[6]).toBe(""); // merged_at should be empty string
    expect(result[13]).toBe('""'); // labels should be empty quoted string
  });
});

describe("generateCSVContent", () => {
  it("PR配列からCSVコンテンツを生成する", () => {
    const prs: EnrichedPR[] = [
      {
        week: "2023-W01",
        collected_at: "2023-01-10T10:00:00Z",
        id: 1,
        number: 123,
        state: "closed" as "open" | "closed",
        created_at: "2023-01-05T10:00:00Z",
        merged_at: "2023-01-06T15:30:00Z",
        title: "Bug fix",
        user: { login: "dev1", avatar_url: "" },
        labels: [{ name: "bug", color: "red" }],
        additions: 5,
        deletions: 2,
        changed_files: 1,
        comments: 1,
        review_comments: 0,
        commits: 1,
        reviews: [],
        comment_list: [],
        review_comment_list: [],
      },
    ];

    const result = generateCSVContent(prs);
    const lines = result.split("\n");

    expect(lines[0]).toBe(
      "week,pr_number,title,state,user,created_at,merged_at,additions,deletions,changed_files,comments,review_comments,commits,labels"
    );
    expect(lines[1]).toBe(
      '2023-W01,123,"Bug fix",closed,dev1,2023-01-05T10:00:00Z,2023-01-06T15:30:00Z,5,2,1,1,0,1,"bug"'
    );
  });
});

describe("generateCSVExport", () => {
  it("CSV形式のエクスポート結果を生成する", () => {
    const prs: EnrichedPR[] = [
      {
        week: "2023-W01",
        collected_at: "2023-01-10T10:00:00Z",
        id: 1,
        number: 123,
        state: "closed" as "open" | "closed",
        created_at: "2023-01-05T10:00:00Z",
        merged_at: "2023-01-06T15:30:00Z",
        title: "Test PR",
        user: { login: "testuser", avatar_url: "" },
        labels: [],
        additions: 10,
        deletions: 5,
        changed_files: 2,
        comments: 0,
        review_comments: 0,
        commits: 1,
        reviews: [],
        comment_list: [],
        review_comment_list: [],
      },
    ];

    const result = generateCSVExport("owner", "repo", prs);

    expect(result.filename).toBe("owner-repo-pr-analytics.csv");
    expect(result.contentType).toBe("text/csv");
    expect(result.content).toContain("week,pr_number,title");
    expect(result.content).toContain("2023-W01,123");
  });
});

describe("generateFilename", () => {
  it("正しいファイル名を生成する", () => {
    const result = generateFilename("microsoft", "vscode", "json");
    expect(result).toBe("microsoft-vscode-pr-analytics.json");
  });

  it("CSV拡張子でも正しく動作する", () => {
    const result = generateFilename("facebook", "react", "csv");
    expect(result).toBe("facebook-react-pr-analytics.csv");
  });
});

describe("calculateUniqueContributors", () => {
  it("ユニークなコントリビューター数を正しく計算する", () => {
    const prs: EnrichedPR[] = [
      { user: { login: "user1", avatar_url: "" } } as EnrichedPR,
      { user: { login: "user2", avatar_url: "" } } as EnrichedPR,
      { user: { login: "user1", avatar_url: "" } } as EnrichedPR,
      { user: { login: "user3", avatar_url: "" } } as EnrichedPR,
    ];

    const result = calculateUniqueContributors(prs);
    expect(result).toBe(3);
  });

  it("空配列の場合は0を返す", () => {
    const result = calculateUniqueContributors([]);
    expect(result).toBe(0);
  });
});

describe("calculateTotalChanges", () => {
  it("総変更行数を正しく計算する", () => {
    const prs: EnrichedPR[] = [
      { additions: 10, deletions: 5 } as EnrichedPR,
      { additions: 20, deletions: 8 } as EnrichedPR,
      { additions: 0, deletions: 15 } as EnrichedPR,
    ];

    const result = calculateTotalChanges(prs);
    expect(result).toBe(58); // 10+5+20+8+0+15
  });

  it("空配列の場合は0を返す", () => {
    const result = calculateTotalChanges([]);
    expect(result).toBe(0);
  });
});
