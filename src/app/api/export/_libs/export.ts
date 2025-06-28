import { DataStorage, WeeklyPRData } from "@/lib/dataStorage";
import {
  ExportData,
  EnrichedPR,
  DataRange,
  ExportSummary,
  Repository,
  CSVExportResult,
  JSONExportResult,
} from "./types";
import {
  calculateUniqueContributors,
  calculateTotalChanges,
  generateCSVExport,
  generateFilename,
} from "./utils";

/**
 * 週次データからPRを統合して拡張情報を付与
 */
export function enrichPRsWithWeekInfo(
  weeklyDataList: WeeklyPRData[]
): EnrichedPR[] {
  return weeklyDataList.flatMap((weekData) =>
    weekData.prs.map((pr) => ({
      ...pr,
      week: weekData.week,
      collected_at: weekData.collected_at,
    }))
  );
}

/**
 * データ範囲情報を計算
 */
export function calculateDataRange(weeklyDataList: WeeklyPRData[]): DataRange {
  if (weeklyDataList.length === 0) {
    throw new Error("No weekly data provided");
  }

  return {
    from: weeklyDataList[0].week,
    to: weeklyDataList[weeklyDataList.length - 1].week,
    totalWeeks: weeklyDataList.length,
  };
}

/**
 * エクスポートサマリーを計算
 */
export function calculateExportSummary(allPRs: EnrichedPR[]): ExportSummary {
  const mergedPRs = allPRs.filter((pr) => pr.merged_at);
  const openPRs = allPRs.filter((pr) => pr.state === "open");

  return {
    totalPRs: allPRs.length,
    mergedPRs: mergedPRs.length,
    openPRs: openPRs.length,
    totalChanges: calculateTotalChanges(allPRs),
    uniqueContributors: calculateUniqueContributors(allPRs),
  };
}

/**
 * エクスポートデータを構築
 */
export function buildExportData(
  owner: string,
  repo: string,
  weeklyDataList: WeeklyPRData[],
  includeAllPRs: boolean = true
): ExportData {
  const allPRs = enrichPRsWithWeekInfo(weeklyDataList);
  const repository: Repository = { owner, name: repo };
  const dataRange = calculateDataRange(weeklyDataList);
  const summary = calculateExportSummary(allPRs);

  return {
    repository,
    exportedAt: new Date().toISOString(),
    dataRange,
    summary,
    weeklyData: weeklyDataList,
    allPRs: includeAllPRs ? allPRs : undefined,
  };
}

/**
 * JSON形式でエクスポート
 */
export function exportAsJSON(
  owner: string,
  repo: string,
  weeklyDataList: WeeklyPRData[]
): JSONExportResult {
  const exportData = buildExportData(owner, repo, weeklyDataList, true);
  const content = JSON.stringify(exportData, null, 2);
  const filename = generateFilename(owner, repo, "json");

  return {
    content,
    filename,
    contentType: "application/json",
  };
}

/**
 * CSV形式でエクスポート
 */
export function exportAsCSV(
  owner: string,
  repo: string,
  weeklyDataList: WeeklyPRData[]
): CSVExportResult {
  const allPRs = enrichPRsWithWeekInfo(weeklyDataList);
  return generateCSVExport(owner, repo, allPRs);
}

/**
 * 指定されたフォーマットでエクスポート
 */
export function exportData(
  owner: string,
  repo: string,
  weeklyDataList: WeeklyPRData[],
  format: "json" | "csv"
): JSONExportResult | CSVExportResult {
  if (format === "csv") {
    return exportAsCSV(owner, repo, weeklyDataList);
  } else {
    return exportAsJSON(owner, repo, weeklyDataList);
  }
}

/**
 * データストレージから週次データを取得してエクスポート
 */
export async function processDataExport(
  dataStorage: DataStorage,
  owner: string,
  repo: string,
  format: "json" | "csv" = "json"
): Promise<{
  success: boolean;
  data?: JSONExportResult | CSVExportResult;
  error?: string;
}> {
  try {
    // 保存された週次データを全て取得
    const weeklyDataList = await dataStorage.getAllWeeksData(owner, repo);

    if (weeklyDataList.length === 0) {
      return {
        success: false,
        error:
          "No data found. Please collect data first using /api/collect-data",
      };
    }

    const exportResult = exportData(owner, repo, weeklyDataList, format);

    return {
      success: true,
      data: exportResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: message,
    };
  }
}
