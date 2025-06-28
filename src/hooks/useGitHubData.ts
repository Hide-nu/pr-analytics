import useSWR from "swr";
import type {
  MemberStats,
  OverallTrend,
  WeeklyTrend,
  LabelStats,
} from "@/app/api/analytics/route";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export interface ErrorInfo {
  message: string;
  type: "network" | "notFound" | "noData" | "server" | "unknown";
  status?: number;
}

interface AnalyticsData {
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
}

const fetcher = async (url: string): Promise<AnalyticsData> => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          JSON.stringify({
            message: "リポジトリまたはデータが見つかりません",
            type: "notFound",
            status: 404,
          } as ErrorInfo)
        );
      }

      if (res.status >= 500) {
        throw new Error(
          JSON.stringify({
            message: "サーバーエラーが発生しました",
            type: "server",
            status: res.status,
          } as ErrorInfo)
        );
      }

      throw new Error(
        JSON.stringify({
          message: `HTTPエラー: ${res.status}`,
          type: "unknown",
          status: res.status,
        } as ErrorInfo)
      );
    }

    const data = await res.json();

    // データが空または不完全な場合をチェック
    if (!data || !data.memberStats || data.memberStats.length === 0) {
      throw new Error(
        JSON.stringify({
          message: "指定された期間にデータが存在しません",
          type: "noData",
          status: res.status,
        } as ErrorInfo)
      );
    }

    return data;
  } catch (error) {
    // ネットワークエラーまたはその他のエラー
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        JSON.stringify({
          message: "ネットワークエラーが発生しました",
          type: "network",
        } as ErrorInfo)
      );
    }

    // 既にフォーマット済みのエラーかチェック
    try {
      JSON.parse((error as Error).message);
      throw error; // 既にフォーマット済み
    } catch {
      // 予期しないエラー
      throw new Error(
        JSON.stringify({
          message: (error as Error).message || "不明なエラーが発生しました",
          type: "unknown",
        } as ErrorInfo)
      );
    }
  }
};

const parseError = (error: Error): ErrorInfo => {
  try {
    return JSON.parse(error.message);
  } catch {
    return {
      message: error.message || "不明なエラーが発生しました",
      type: "unknown",
    };
  }
};

export function useAnalyticsData(
  owner: string,
  repo: string,
  dateRange?: DateRange
) {
  const baseUrl = `/api/analytics?owner=${owner}&repo=${repo}`;
  const url = dateRange
    ? `${baseUrl}&from=${dateRange.from}&to=${dateRange.to}`
    : baseUrl;

  const { data, error, isLoading } = useSWR<AnalyticsData>(url, fetcher, {
    refreshInterval: 60000, // 1分ごとに更新
    revalidateOnFocus: false,
    shouldRetryOnError: (error) => {
      const errorInfo = parseError(error);
      // 404やデータなしの場合はリトライしない
      return errorInfo.type !== "notFound" && errorInfo.type !== "noData";
    },
  });

  const errorInfo = error ? parseError(error) : null;

  return {
    data,
    hasData: Boolean(data && data.memberStats && data.memberStats.length > 0),
    isLoading,
    isError: Boolean(error),
    error: errorInfo,
  };
}

export function useComparisonData(
  owner: string,
  repo: string,
  mainRange: DateRange,
  comparisonRange?: DateRange | null
) {
  const mainData = useAnalyticsData(owner, repo, mainRange);

  const comparisonUrl = comparisonRange
    ? `/api/analytics?owner=${owner}&repo=${repo}&from=${comparisonRange.from}&to=${comparisonRange.to}`
    : null;

  const {
    data: comparisonData,
    error: comparisonError,
    isLoading: comparisonLoading,
  } = useSWR<AnalyticsData>(comparisonUrl, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    shouldRetryOnError: (error) => {
      const errorInfo = parseError(error);
      return errorInfo.type !== "notFound" && errorInfo.type !== "noData";
    },
  });

  const comparisonErrorInfo = comparisonError
    ? parseError(comparisonError)
    : null;

  return {
    mainData: mainData.data,
    mainHasData: mainData.hasData,
    comparisonData,
    comparisonHasData: Boolean(
      comparisonData &&
        comparisonData.memberStats &&
        comparisonData.memberStats.length > 0
    ),
    isLoading: mainData.isLoading || comparisonLoading,
    isError: mainData.isError || Boolean(comparisonError),
    error: mainData.error || comparisonErrorInfo,
  };
}
