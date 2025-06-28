import React from "react";
import MetricCard from "./MetricCard";
import { AnalyticsData } from "@/types/analytics";

interface OverallMetricsProps {
  data: AnalyticsData;
  comparisonData?: AnalyticsData;
}

const OverallMetrics: React.FC<OverallMetricsProps> = ({
  data,
  comparisonData,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        👉 Overall Metrics
        {comparisonData && (
          <span className="text-sm font-normal text-green-600 ml-2">
            (比較データ利用可能)
          </span>
        )}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total PRs"
          value={data.overallTrend.totalPRs}
          comparisonValue={comparisonData?.overallTrend.totalPRs}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Merged PRs"
          value={data.overallTrend.mergedPRs}
          comparisonValue={comparisonData?.overallTrend.mergedPRs}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Merge Ratio"
          value={`${data.overallTrend.mergeRatio.toFixed(1)}%`}
          comparisonValue={`${comparisonData?.overallTrend.mergeRatio.toFixed(
            1
          )}%`}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Avg Merge Time"
          value={`${data.overallTrend.avgMergeTime.toFixed(1)}h`}
          comparisonValue={`${comparisonData?.overallTrend.avgMergeTime.toFixed(
            1
          )}h`}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Active Developers"
          value={data.overallTrend.activeDevelopers}
          comparisonValue={comparisonData?.overallTrend.activeDevelopers}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Avg PRs per Week"
          value={data.overallTrend.avgPRsPerWeek.toFixed(1)}
          comparisonValue={comparisonData?.overallTrend.avgPRsPerWeek.toFixed(
            1
          )}
          showComparison={!!comparisonData}
        />
        <MetricCard
          title="Avg Changes per Week"
          value={data.overallTrend.avgChangesPerWeek.toFixed(0)}
          comparisonValue={comparisonData?.overallTrend.avgChangesPerWeek.toFixed(
            0
          )}
          showComparison={!!comparisonData}
        />
      </div>
    </div>
  );
};

export default OverallMetrics;
