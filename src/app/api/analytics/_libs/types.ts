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

export interface AnalyticsResult {
  memberStats: MemberStats[];
  weeklyTrends: WeeklyTrend[];
  overallTrend: OverallTrend;
  labelStats: LabelStats;
}
