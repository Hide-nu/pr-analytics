"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatWeekDisplay } from "@/lib/weekFormat";

interface LabelTimelineData {
  week: string;
  totalPRs: number;
  bug: number;
  "tech-debt": number;
  refactoring: number;
  feature: number;
  documentation: number;
  test: number;
  chore: number;
  other: number;
  bugPercentage: number;
  techDebtPercentage: number;
  refactoringPercentage: number;
  featurePercentage: number;
  documentationPercentage: number;
  testPercentage: number;
  chorePercentage: number;
  otherPercentage: number;
}

interface LabelTimelineChartProps {
  data: LabelTimelineData[];
  showPercentage?: boolean;
  chartType?: "line" | "bar";
}

const LABEL_COLORS = {
  bug: "#ef4444", // red-500
  "tech-debt": "#f97316", // orange-500
  refactoring: "#06b6d4", // cyan-500
  feature: "#10b981", // emerald-500
  documentation: "#8b5cf6", // violet-500
  test: "#f59e0b", // amber-500
  chore: "#6b7280", // gray-500
  other: "#64748b", // slate-500
};

const LABEL_TRANSLATIONS = {
  bug: "バグ修正",
  "tech-debt": "技術的負債",
  refactoring: "リファクタリング",
  feature: "機能追加",
  documentation: "ドキュメント",
  test: "テスト",
  chore: "雑務",
  other: "その他",
};

export function LabelTimelineChart({
  data,
  showPercentage = false,
  chartType = "line",
}: LabelTimelineChartProps) {
  const formatTooltip = (value: number, name: string) => {
    const translatedName =
      LABEL_TRANSLATIONS[name as keyof typeof LABEL_TRANSLATIONS] || name;
    if (showPercentage) {
      return [`${value.toFixed(1)}%`, translatedName];
    }
    return [`${value}`, translatedName];
  };

  const formatXAxis = (tickItem: string) => {
    return formatWeekDisplay(tickItem);
  };

  const yAxisLabel = showPercentage ? "割合 (%)" : "PR数";

  if (chartType === "bar") {
    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="week"
              tickFormatter={formatXAxis}
              className="text-xs"
            />
            <YAxis
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
              className="text-xs"
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                color: "#333",
              }}
            />
            <Legend />

            {Object.entries(LABEL_COLORS).map(([label, color]) => (
              <Bar
                key={label}
                dataKey={showPercentage ? `${label}Percentage` : label}
                stackId="labels"
                fill={color}
                name={
                  LABEL_TRANSLATIONS[label as keyof typeof LABEL_TRANSLATIONS]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="week"
            tickFormatter={formatXAxis}
            className="text-xs"
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
            className="text-xs"
          />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              color: "#333",
            }}
          />
          <Legend />

          {Object.entries(LABEL_COLORS).map(([label, color]) => (
            <Line
              key={label}
              type="monotone"
              dataKey={showPercentage ? `${label}Percentage` : label}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              name={
                LABEL_TRANSLATIONS[label as keyof typeof LABEL_TRANSLATIONS]
              }
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
