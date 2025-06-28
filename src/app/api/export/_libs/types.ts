export interface ExportRequest {
  owner: string;
  repo: string;
  format?: "json" | "csv";
}

export interface DataRange {
  from: string;
  to: string;
  totalWeeks: number;
}

export interface ExportSummary {
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  totalChanges: number;
  uniqueContributors: number;
}

export interface Repository {
  owner: string;
  name: string;
}

import { WeeklyPRData } from "@/lib/dataStorage";
import { PRDetail } from "../../collect-data/_libs/types";

export interface ExportData {
  repository: Repository;
  exportedAt: string;
  dataRange: DataRange;
  summary: ExportSummary;
  weeklyData: WeeklyPRData[];
  allPRs?: PRDetail[];
}

export interface EnrichedPR extends PRDetail {
  week: string;
  collected_at: string;
}

export interface CSVExportResult {
  content: string;
  filename: string;
  contentType: string;
}

export interface JSONExportResult {
  content: string;
  filename: string;
  contentType: string;
}
