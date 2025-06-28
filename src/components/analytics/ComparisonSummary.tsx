import React from "react";
import { AnalyticsData } from "@/types/analytics";

interface ComparisonSummaryProps {
  data: AnalyticsData;
  comparisonData: AnalyticsData;
}

const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  data,
  comparisonData,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📊 期間比較サマリー
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            総PR数の変化
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {data.overallTrend.totalPRs}
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="text-lg font-bold">
              {comparisonData.overallTrend.totalPRs}
            </span>
          </div>
          <div
            className={`text-sm font-medium mt-1 ${
              data.overallTrend.totalPRs > comparisonData.overallTrend.totalPRs
                ? "text-green-600"
                : data.overallTrend.totalPRs <
                  comparisonData.overallTrend.totalPRs
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {data.overallTrend.totalPRs > comparisonData.overallTrend.totalPRs
              ? "↗️ 増加"
              : data.overallTrend.totalPRs <
                comparisonData.overallTrend.totalPRs
              ? "↘️ 減少"
              : "→ 変化なし"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            マージ率の変化
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {data.overallTrend.mergeRatio.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="text-lg font-bold">
              {comparisonData.overallTrend.mergeRatio.toFixed(1)}%
            </span>
          </div>
          <div
            className={`text-sm font-medium mt-1 ${
              data.overallTrend.mergeRatio >
              comparisonData.overallTrend.mergeRatio
                ? "text-green-600"
                : data.overallTrend.mergeRatio <
                  comparisonData.overallTrend.mergeRatio
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {data.overallTrend.mergeRatio >
            comparisonData.overallTrend.mergeRatio
              ? "↗️ 改善"
              : data.overallTrend.mergeRatio <
                comparisonData.overallTrend.mergeRatio
              ? "↘️ 悪化"
              : "→ 変化なし"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            平均マージ時間の変化
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {data.overallTrend.avgMergeTime.toFixed(1)}h
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="text-lg font-bold">
              {comparisonData.overallTrend.avgMergeTime.toFixed(1)}h
            </span>
          </div>
          <div
            className={`text-sm font-medium mt-1 ${
              data.overallTrend.avgMergeTime <
              comparisonData.overallTrend.avgMergeTime
                ? "text-green-600"
                : data.overallTrend.avgMergeTime >
                  comparisonData.overallTrend.avgMergeTime
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {data.overallTrend.avgMergeTime <
            comparisonData.overallTrend.avgMergeTime
              ? "↗️ 高速化"
              : data.overallTrend.avgMergeTime >
                comparisonData.overallTrend.avgMergeTime
              ? "↘️ 低速化"
              : "→ 変化なし"}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            アクティブ開発者数の変化
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {data.overallTrend.activeDevelopers}
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span className="text-lg font-bold">
              {comparisonData.overallTrend.activeDevelopers}
            </span>
          </div>
          <div
            className={`text-sm font-medium mt-1 ${
              data.overallTrend.activeDevelopers >
              comparisonData.overallTrend.activeDevelopers
                ? "text-green-600"
                : data.overallTrend.activeDevelopers <
                  comparisonData.overallTrend.activeDevelopers
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {data.overallTrend.activeDevelopers >
            comparisonData.overallTrend.activeDevelopers
              ? "↗️ 増加"
              : data.overallTrend.activeDevelopers <
                comparisonData.overallTrend.activeDevelopers
              ? "↘️ 減少"
              : "→ 変化なし"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSummary;
