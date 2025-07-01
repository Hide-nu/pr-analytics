export interface MemberStats {
  user: string;
  avatar_url: string;
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  avgChanges: number;
  avgMergeTime: number;
  totalComments: number;
  totalReviewComments: number;
  avgCommits: number;
  labels: string[];
  commentInteractions: Array<{
    user: string;
    avatar_url: string;
    count: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    prs: number;
    changes: number;
    mergeTime: number;
  }>;
}

export interface WeeklyTrend {
  week: string;
  totalPRs: number;
  avgChanges: number;
  avgMergeTime: number;
  mergedPRs: number;
}

export interface OverallTrend {
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
  avgChanges: number;
  avgMergeTime: number;
  totalComments: number;
  totalReviewComments: number;
  avgCommits: number;
  activeDevelopers: number;
  avgPRsPerWeek: number;
  avgChangesPerWeek: number;
  mergeRatio: number;
}

export interface LabelStats {
  [key: string]: {
    count: number;
    color: string;
  };
}

export interface LabelTimelineData {
  week: string;
  totalPRs: number;
  bug: number;
  "tech-debt": number;
  refactoring: number;
  feature: number;
  documentation: number;
  test: number;
  chore: number;
  other: number;
  bugPercentage: number;
  techDebtPercentage: number;
  refactoringPercentage: number;
  featurePercentage: number;
  documentationPercentage: number;
  testPercentage: number;
  chorePercentage: number;
  otherPercentage: number;
}

export interface CycleTimeBreakdownData {
  week: string;
  avgTimeToFirstReview: number; // レビュー待ち時間（時間）
  avgReviewTime: number; // レビュー時間（時間）
  avgTimeToMerge: number; // 最終レビューからマージまでの時間（時間）
  avgTotalCycleTime: number; // 全体のサイクルタイム（時間）
  totalPRs: number;
  bottleneckType: "review-wait" | "review-process" | "merge-wait" | "balanced";
  medianCycleTime: number;
  p95CycleTime: number;
}

export interface CodeChurnData {
  week: string;
  avgChurnRate: number; // 平均手戻り率（%）
  avgCommitsPerPR: number; // PR当たり平均コミット数
  avgChangesPerCommit: number; // コミット当たり平均変更行数
  avgReviewRounds: number; // 平均レビューラウンド数
  totalPRs: number;
  highChurnPRs: number; // 高手戻り率PR数（手戻り率>50%）
  highChurnRate: number; // 高手戻り率PRの割合（%）

  // 統計値
  medianChurnRate: number;
  p95ChurnRate: number; // 95パーセンタイル
  avgTotalChanges: number; // 平均変更行数
  churnTrend: "improving" | "stable" | "degrading"; // トレンド
}

export interface AnalyticsResult {
  memberStats: MemberStats[];
  weeklyTrends: WeeklyTrend[];
  overallTrend: OverallTrend;
  labelStats: LabelStats;
  labelTimeline: LabelTimelineData[];
  cycleTimeBreakdown: CycleTimeBreakdownData[];
  codeChurn: CodeChurnData[];
}
