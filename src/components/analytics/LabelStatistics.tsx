import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { AnalyticsData } from "@/types/analytics";

interface LabelStatisticsProps {
  data: AnalyticsData;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
];

const LabelStatistics: React.FC<LabelStatisticsProps> = ({ data }) => {
  // ラベルデータをチャート形式に変換
  const totalLabelCount = Object.values(data.labelStats).reduce(
    (sum, s) => sum + s.count,
    0
  );

  const labelChartData = Object.entries(data.labelStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 7)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      percentage:
        totalLabelCount > 0 ? (stats.count / totalLabelCount) * 100 : 0,
    }));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🏷️ Overall Label Statistics
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">ラベル使用状況</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={labelChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) =>
                  `${name} (${percentage.toFixed(1)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {labelChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  color: "#333",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">詳細統計</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-600">
                  <th className="text-left py-2">Label</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Color</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.labelStats)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 10)
                  .map(([name, stats]) => (
                    <tr key={name} className="border-b dark:border-gray-700">
                      <td className="py-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                          {name}
                        </span>
                      </td>
                      <td className="text-right py-2">{stats.count}</td>
                      <td className="text-right py-2">
                        <div
                          className="w-4 h-4 rounded mx-auto"
                          style={{ backgroundColor: `#${stats.color}` }}
                        ></div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelStatistics;
