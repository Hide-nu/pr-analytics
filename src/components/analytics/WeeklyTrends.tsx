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
import { formatWeekDisplay } from "@/lib/weekFormat";

interface WeeklyTrendsProps {
  data: AnalyticsData;
}

const WeeklyTrends: React.FC<WeeklyTrendsProps> = ({ data }) => {
  const weeklyChartData = data.weeklyTrends.map((trend) => ({
    week: trend.week,
    weekDisplay: formatWeekDisplay(trend.week),
    count: trend.totalPRs,
    avgChanges: trend.avgChanges,
    avgMergeTime: trend.avgMergeTime,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📈 Weekly PR Count Trends
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="weekDisplay"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
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
          <Bar dataKey="count" fill="#0088FE" name="PR Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyTrends;
