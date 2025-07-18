import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";
import { AnalyticsData } from "@/types/analytics";
import { formatWeekDisplay } from "@/lib/weekFormat";

interface TrendsAnalysisProps {
  data: AnalyticsData;
  comparisonData?: AnalyticsData;
}

interface WeeklyChartData {
  week: string;
  weekDisplay: string;
  count: number;
  avgChanges: number;
  avgMergeTime: number;
  comparisonCount?: number | null;
  comparisonAvgChanges?: number | null;
  comparisonAvgMergeTime?: number | null;
}

const TrendsAnalysis: React.FC<TrendsAnalysisProps> = ({
  data,
  comparisonData,
}) => {
  // 週次トレンドデータ（比較データも含む）
  const weeklyChartData: WeeklyChartData[] = data.weeklyTrends.map((trend) => {
    const comparisonTrend = comparisonData?.weeklyTrends.find(
      (ct) => ct.week === trend.week
    );

    return {
      week: trend.week,
      weekDisplay: formatWeekDisplay(trend.week),
      count: trend.totalPRs,
      avgChanges: trend.avgChanges,
      avgMergeTime: trend.avgMergeTime,
      // 比較データ
      comparisonCount: comparisonTrend?.totalPRs || null,
      comparisonAvgChanges: comparisonTrend?.avgChanges || null,
      comparisonAvgMergeTime: comparisonTrend?.avgMergeTime || null,
    };
  });

  // 比較用の最大値を計算
  const getMaxValue = (
    mainValues: number[],
    comparisonValues: (number | null | undefined)[]
  ) => {
    const allValues = [
      ...mainValues,
      ...comparisonValues.filter(
        (v): v is number => v !== null && v !== undefined
      ),
    ];
    return allValues.length > 0 ? Math.max(...allValues) * 1.1 : undefined; // 10%のマージンを追加
  };

  const maxChanges = comparisonData
    ? getMaxValue(
        weeklyChartData.map((d) => d.avgChanges),
        weeklyChartData.map((d) => d.comparisonAvgChanges)
      )
    : undefined;

  const maxMergeTime = comparisonData
    ? getMaxValue(
        weeklyChartData.map((d) => d.avgMergeTime),
        weeklyChartData.map((d) => d.comparisonAvgMergeTime)
      )
    : undefined;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📈 Overall Trends Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 平均変更行数の推移 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            平均変更行数の推移
            {comparisonData && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (オレンジ: メイン期間、緑: 比較期間)
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="weekDisplay"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={maxChanges ? [0, maxChanges] : undefined}
                tickFormatter={(value) =>
                  Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value?.toFixed(0) || "N/A",
                  name === "avgChanges"
                    ? "平均変更行数 (メイン)"
                    : "平均変更行数 (比較)",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#333",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgChanges"
                stroke="#FF8042"
                strokeWidth={2}
                dot={{ fill: "#FF8042", strokeWidth: 2, r: 4 }}
                name="メイン期間"
              />
              {comparisonData && (
                <Line
                  type="monotone"
                  dataKey="comparisonAvgChanges"
                  stroke="#00C49F"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                  name="比較期間"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* マージ速度の推移 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            平均マージ速度の推移
            {comparisonData && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (緑: メイン期間、紫: 比較期間)
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="weekDisplay"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={maxMergeTime ? [0, maxMergeTime] : undefined}
                tickFormatter={(value) =>
                  Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value?.toFixed(1) + " hours" || "N/A",
                  name === "avgMergeTime"
                    ? "平均マージ時間 (メイン)"
                    : "平均マージ時間 (比較)",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#333",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgMergeTime"
                stroke="#00C49F"
                strokeWidth={2}
                dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                name="メイン期間"
              />
              {comparisonData && (
                <Line
                  type="monotone"
                  dataKey="comparisonAvgMergeTime"
                  stroke="#8884D8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#8884D8", strokeWidth: 2, r: 4 }}
                  name="比較期間"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 複合チャート - PR数と平均値の相関 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
          PR数・変更行数・マージ時間の相関
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="weekDisplay"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) =>
                Number(value).toFixed(value % 1 === 0 ? 0 : 1)
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) =>
                Number(value).toFixed(value % 1 === 0 ? 0 : 1)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                color: "#333",
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#0088FE" name="PR数" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgChanges"
              stroke="#FF8042"
              name="平均変更行数"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgMergeTime"
              stroke="#00C49F"
              name="平均マージ時間(時間)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendsAnalysis;
