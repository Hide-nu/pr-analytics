import {
  MemberStats,
  OverallTrend,
  WeeklyTrend,
  LabelStats,
  LabelTimelineData,
  CycleTimeBreakdownData,
  CodeChurnData,
} from "@/app/api/analytics/route";

export interface AnalyticsData {
  repository: { owner: string; name: string };
  dataRange: {
    from: string;
    to: string;
    totalWeeks: number;
  };
  lastUpdated: string;
  memberStats: MemberStats[];
  weeklyTrends: WeeklyTrend[];
  overallTrend: OverallTrend;
  labelStats: LabelStats;
  labelTimeline: LabelTimelineData[];
  cycleTimeBreakdown: CycleTimeBreakdownData[];
  codeChurn: CodeChurnData[];
}

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export interface AnalyticsDashboardProps {
  data: AnalyticsData;
  comparisonData?: AnalyticsData;
  selectedRange: DateRange;
  comparisonRange?: DateRange | null;
}

export interface CommentInteraction {
  from: string;
  fromAvatar: string;
  to: string;
  toAvatar: string;
  count: number;
}

export type {
  MemberStats,
  OverallTrend,
  WeeklyTrend,
  LabelStats,
  LabelTimelineData,
  CycleTimeBreakdownData,
  CodeChurnData,
};
