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
import { AnalyticsData, DateRange, MemberStats } from "@/types/analytics";
import { formatWeekDisplay } from "@/lib/weekFormat";

interface MemberDetailViewProps {
  member: MemberStats;
  onClose: () => void;
  comparisonData?: AnalyticsData;
  selectedRange: DateRange;
  comparisonRange?: DateRange | null;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({
  member,
  onClose,
  comparisonData,
  selectedRange,
  comparisonRange,
}) => {
  // 比較データから同じメンバーの情報を取得
  const comparisonMember = comparisonData?.memberStats.find(
    (m) => m.user === member.user
  );

  // メイン期間のチャートデータを作成
  const memberChartData = member.weeklyTrends.map((trend, index) => ({
    week: trend.week,
    weekDisplay: formatWeekDisplay(trend.week),
    relativeWeek: `Week ${index + 1}`,
    prs: trend.prs,
    changes: trend.changes,
    mergeTime: trend.mergeTime,
  }));

  // 比較期間のチャートデータを作成（独立した相対的週番号を使用）
  const comparisonChartData =
    comparisonMember?.weeklyTrends.map((trend, index) => ({
      week: trend.week,
      weekDisplay: formatWeekDisplay(trend.week),
      relativeWeek: `Week ${index + 1}`,
      prs: trend.prs,
      changes: trend.changes,
      mergeTime: trend.mergeTime,
    })) || [];

  // 比較用の最大値を計算
  const getMaxValue = (mainValues: number[], comparisonValues: number[]) => {
    const allValues = [...mainValues, ...comparisonValues];
    return allValues.length > 0 ? Math.max(...allValues) : undefined; // 10%のマージンを追加
  };

  const maxPRs = comparisonMember
    ? getMaxValue(
        memberChartData.map((d) => d.prs),
        comparisonChartData.map((d) => d.prs)
      )
    : undefined;

  const maxChanges = comparisonMember
    ? getMaxValue(
        memberChartData.map((d) => d.changes),
        comparisonChartData.map((d) => d.changes)
      )
    : undefined;

  const maxMergeTime = comparisonMember
    ? getMaxValue(
        memberChartData.map((d) => d.mergeTime),
        comparisonChartData.map((d) => d.mergeTime)
      )
    : undefined;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={member.avatar_url}
            alt={member.user}
            className="w-10 h-10 rounded-full"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {member.user} - 詳細分析
          </h2>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          閉じる
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 週次PR作成数 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">週次PR作成数</h3>

          {/* メイン期間のグラフ */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-blue-600 mb-2">
              📊 メイン期間: {selectedRange.label}
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={memberChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="relativeWeek" />
                <YAxis
                  domain={maxPRs ? [0, maxPRs] : undefined}
                  tickFormatter={(value) =>
                    Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [value || "N/A", "PR Count"]}
                  labelFormatter={(label) =>
                    `${label} (${
                      memberChartData.find((d) => d.relativeWeek === label)
                        ?.weekDisplay
                    })`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="prs"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 比較期間のグラフ */}
          {comparisonMember && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-orange-600 mb-2">
                📊 比較期間: {comparisonRange?.label}
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="relativeWeek" />
                  <YAxis
                    domain={maxPRs ? [0, maxPRs] : undefined}
                    tickFormatter={(value) =>
                      Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [value || "N/A", "PR Count"]}
                    labelFormatter={(label) =>
                      `${label} (${
                        comparisonChartData.find(
                          (d) => d.relativeWeek === label
                        )?.weekDisplay
                      })`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="prs"
                    stroke="#FF8042"
                    strokeWidth={2}
                    dot={{ fill: "#FF8042", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 週次平均変更行数 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">週次平均変更行数</h3>

          {/* メイン期間のグラフ */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-orange-600 mb-2">
              📊 メイン期間: {selectedRange.label}
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={memberChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="relativeWeek" />
                <YAxis
                  domain={maxChanges ? [0, maxChanges] : undefined}
                  tickFormatter={(value) =>
                    Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    value?.toFixed(0) || "N/A",
                    "平均変更行数",
                  ]}
                  labelFormatter={(label) =>
                    `${label} (${
                      memberChartData.find((d) => d.relativeWeek === label)
                        ?.weekDisplay
                    })`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="changes"
                  stroke="#FF8042"
                  strokeWidth={2}
                  dot={{ fill: "#FF8042", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 比較期間のグラフ */}
          {comparisonMember && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-green-600 mb-2">
                📊 比較期間: {comparisonRange?.label}
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="relativeWeek" />
                  <YAxis
                    domain={maxChanges ? [0, maxChanges] : undefined}
                    tickFormatter={(value) =>
                      Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value?.toFixed(0) || "N/A",
                      "平均変更行数",
                    ]}
                    labelFormatter={(label) =>
                      `${label} (${
                        comparisonChartData.find(
                          (d) => d.relativeWeek === label
                        )?.weekDisplay
                      })`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="changes"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 週次平均マージ時間 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">週次平均マージ時間</h3>

          {/* メイン期間のグラフ */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-green-600 mb-2">
              📊 メイン期間: {selectedRange.label}
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={memberChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="relativeWeek" />
                <YAxis
                  domain={maxMergeTime ? [0, maxMergeTime] : undefined}
                  tickFormatter={(value) =>
                    Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    value?.toFixed(1) + " hours" || "N/A",
                    "平均マージ時間",
                  ]}
                  labelFormatter={(label) =>
                    `${label} (${
                      memberChartData.find((d) => d.relativeWeek === label)
                        ?.weekDisplay
                    })`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="mergeTime"
                  stroke="#00C49F"
                  strokeWidth={2}
                  dot={{ fill: "#00C49F", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 比較期間のグラフ */}
          {comparisonMember && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-purple-600 mb-2">
                📊 比較期間: {comparisonRange?.label}
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="relativeWeek" />
                  <YAxis
                    domain={maxMergeTime ? [0, maxMergeTime] : undefined}
                    tickFormatter={(value) =>
                      Number(value).toFixed(value % 1 === 0 ? 0 : 1)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value?.toFixed(1) + " hours" || "N/A",
                      "平均マージ時間",
                    ]}
                    labelFormatter={(label) =>
                      `${label} (${
                        comparisonChartData.find(
                          (d) => d.relativeWeek === label
                        )?.weekDisplay
                      })`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="mergeTime"
                    stroke="#8884D8"
                    strokeWidth={2}
                    dot={{ fill: "#8884D8", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* コメントインタラクション */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            コメントインタラクション
          </h3>
          {member.commentInteractions.length > 0 ? (
            <div className="space-y-2">
              {member.commentInteractions.map((interaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={interaction.avatar_url}
                      alt={interaction.user}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm">{interaction.user}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {interaction.count} comments
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">コメントインタラクションなし</p>
          )}
        </div>
      </div>

      {/* 複合トレンド - メンバーのパフォーマンス総合 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
          {member.user}のパフォーマンス総合
        </h3>

        {/* メイン期間のパフォーマンス */}
        <div className="mb-4">
          <h4 className="text-md font-medium text-blue-600 mb-2">
            📊 メイン期間: {selectedRange.label}
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={memberChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="relativeWeek" />
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
                labelFormatter={(label) =>
                  `${label} (${
                    memberChartData.find((d) => d.relativeWeek === label)
                      ?.weekDisplay
                  })`
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="prs" fill="#0088FE" name="PR数" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="changes"
                stroke="#FF8042"
                name="平均変更行数"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mergeTime"
                stroke="#00C49F"
                name="平均マージ時間(時間)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 比較期間のパフォーマンス */}
        {comparisonMember && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium text-purple-600 mb-2">
              📊 比較期間: {comparisonRange?.label}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="relativeWeek" />
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
                  labelFormatter={(label) =>
                    `${label} (${
                      comparisonChartData.find((d) => d.relativeWeek === label)
                        ?.weekDisplay
                    })`
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="prs" fill="#FFB366" name="PR数" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="changes"
                  stroke="#FF8042"
                  name="平均変更行数"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mergeTime"
                  stroke="#00C49F"
                  name="平均マージ時間(時間)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetailView;
