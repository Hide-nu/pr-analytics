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

interface WeeklyTrendsProps {
  data: AnalyticsData;
}

const WeeklyTrends: React.FC<WeeklyTrendsProps> = ({ data }) => {
  const weeklyChartData = data.weeklyTrends.map((trend) => ({
    week: trend.week,
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
          <XAxis dataKey="week" />
          <YAxis
            tickFormatter={(value) =>
              Number(value).toFixed(value % 1 === 0 ? 0 : 1)
            }
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#0088FE" name="PR Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyTrends;
