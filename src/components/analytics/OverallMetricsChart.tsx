import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { AnalyticsData } from "@/types/analytics";

interface OverallMetricsChartProps {
  data: AnalyticsData;
  comparisonData: AnalyticsData;
}

const OverallMetricsChart: React.FC<OverallMetricsChartProps> = ({
  data,
  comparisonData,
}) => {
  // グラフ用データを準備
  const chartData = [
    {
      metric: "Total PRs",
      mainValue: data.overallTrend.totalPRs,
      comparisonValue: comparisonData.overallTrend.totalPRs,
      unit: "",
    },
    {
      metric: "Merged PRs",
      mainValue: data.overallTrend.mergedPRs,
      comparisonValue: comparisonData.overallTrend.mergedPRs,
      unit: "",
    },
    {
      metric: "Merge Ratio",
      mainValue: data.overallTrend.mergeRatio,
      comparisonValue: comparisonData.overallTrend.mergeRatio,
      unit: "%",
    },
    {
      metric: "Avg Merge Time",
      mainValue: data.overallTrend.avgMergeTime,
      comparisonValue: comparisonData.overallTrend.avgMergeTime,
      unit: "h",
    },
    {
      metric: "Active Developers",
      mainValue: data.overallTrend.activeDevelopers,
      comparisonValue: comparisonData.overallTrend.activeDevelopers,
      unit: "",
    },
    {
      metric: "Avg PRs/Week",
      mainValue: data.overallTrend.avgPRsPerWeek,
      comparisonValue: comparisonData.overallTrend.avgPRsPerWeek,
      unit: "",
    },
    {
      metric: "Avg Changes/Week",
      mainValue: data.overallTrend.avgChangesPerWeek,
      comparisonValue: comparisonData.overallTrend.avgChangesPerWeek,
      unit: "",
    },
  ];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: (typeof chartData)[0];
      dataKey: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const mainValue = payload.find((p) => p.dataKey === "mainValue")?.value;
      const comparisonValue = payload.find(
        (p) => p.dataKey === "comparisonValue"
      )?.value;

      if (mainValue === undefined || comparisonValue === undefined) {
        return null;
      }

      const isImprovement =
        label === "Avg Merge Time"
          ? mainValue < comparisonValue
          : mainValue > comparisonValue;

      const changePercent =
        comparisonValue !== 0
          ? (((mainValue - comparisonValue) / comparisonValue) * 100).toFixed(1)
          : "N/A";

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-blue-600">
            メイン期間:{" "}
            {typeof mainValue === "number" ? mainValue.toFixed(1) : mainValue}
            {data.unit}
          </p>
          <p className="text-orange-600">
            比較期間:{" "}
            {typeof comparisonValue === "number"
              ? comparisonValue.toFixed(1)
              : comparisonValue}
            {data.unit}
          </p>
          <p
            className={`font-medium ${
              isImprovement ? "text-green-600" : "text-red-600"
            }`}
          >
            変化: {changePercent}% {isImprovement ? "↗️ 改善" : "↘️ 悪化"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📊 全体指標グラフ比較
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        メイン期間（青）と比較期間（オレンジ）の全体指標を視覚的に比較
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="metric"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              typeof value === "number"
                ? value.toFixed(value % 1 === 0 ? 0 : 1)
                : value
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="mainValue"
            fill="#3B82F6"
            name="メイン期間"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="comparisonValue"
            fill="#F97316"
            name="比較期間"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 改善度の可視化 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          改善度一覧
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartData.map((item) => {
            const isImprovement =
              item.metric === "Avg Merge Time"
                ? item.mainValue < item.comparisonValue
                : item.mainValue > item.comparisonValue;

            const changePercent =
              item.comparisonValue !== 0
                ? (
                    ((item.mainValue - item.comparisonValue) /
                      item.comparisonValue) *
                    100
                  ).toFixed(1)
                : "0";

            return (
              <div
                key={item.metric}
                className={`p-3 rounded-lg border-2 ${
                  isImprovement
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                }`}
              >
                <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                  {item.metric}
                </h4>
                <p
                  className={`text-lg font-bold ${
                    isImprovement ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {changePercent}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isImprovement ? "↗️ 改善" : "↘️ 悪化"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverallMetricsChart;
