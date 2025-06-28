import { EnrichedPR, CSVExportResult } from "./types";

/**
 * CSVエスケープ - ダブルクォートをエスケープしてCSV用文字列を作成
 */
export function escapeCSVField(field: string): string {
  return `"${field.replace(/"/g, '""')}"`;
}

/**
 * PR配列からCSVヘッダーを生成
 */
export function generateCSVHeaders(): string[] {
  return [
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
  ];
}

/**
 * 単一PRをCSV行に変換
 */
export function convertPRToCSVRow(pr: EnrichedPR): string[] {
  return [
    pr.week,
    pr.number.toString(),
    escapeCSVField(pr.title),
    pr.state,
    pr.user.login,
    pr.created_at,
    pr.merged_at || "",
    pr.additions.toString(),
    pr.deletions.toString(),
    pr.changed_files.toString(),
    pr.comments.toString(),
    pr.review_comments.toString(),
    pr.commits.toString(),
    escapeCSVField(pr.labels.map((l) => l.name).join(";")),
  ];
}

/**
 * PR配列をCSVコンテンツに変換
 */
export function generateCSVContent(prs: EnrichedPR[]): string {
  const headers = generateCSVHeaders();
  const rows = prs.map(convertPRToCSVRow);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * CSV形式でエクスポート結果を生成
 */
export function generateCSVExport(
  owner: string,
  repo: string,
  prs: EnrichedPR[]
): CSVExportResult {
  const content = generateCSVContent(prs);
  const filename = `${owner}-${repo}-pr-analytics.csv`;

  return {
    content,
    filename,
    contentType: "text/csv",
  };
}

/**
 * ファイル名を生成（owner-repo-pr-analytics.ext）
 */
export function generateFilename(
  owner: string,
  repo: string,
  extension: string
): string {
  return `${owner}-${repo}-pr-analytics.${extension}`;
}

/**
 * ユニークなコントリビューター数を計算
 */
export function calculateUniqueContributors(prs: EnrichedPR[]): number {
  const uniqueUsers = new Set(prs.map((pr) => pr.user.login));
  return uniqueUsers.size;
}

/**
 * 総変更行数を計算（追加+削除）
 */
export function calculateTotalChanges(prs: EnrichedPR[]): number {
  return prs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0);
}
