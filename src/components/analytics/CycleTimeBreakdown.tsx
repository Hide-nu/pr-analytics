"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { formatWeekDisplay } from "@/lib/weekFormat";
import { AnalyticsData } from "@/types/analytics";

interface CycleTimeData {
  week: string;
  avgTimeToFirstReview: number; // レビュー待ち時間（時間）
  avgReviewTime: number; // レビュー時間（時間）
  avgTimeToMerge: number; // 最終レビューからマージまでの時間（時間）
  avgTotalCycleTime: number; // 全体のサイクルタイム（時間）
  totalPRs: number;
  bottleneckType: "review-wait" | "review-process" | "merge-wait" | "balanced";
}

interface CycleTimeBreakdownProps {
  data: AnalyticsData;
}

const CYCLE_TIME_COLORS = {
  "review-wait": "#ef4444", // red-500 - レビュー待ち
  "review-process": "#f97316", // orange-500 - レビュー中
  "merge-wait": "#eab308", // yellow-500 - マージ待ち
  total: "#6366f1", // indigo-500 - 全体
};

export function CycleTimeBreakdown({ data }: CycleTimeBreakdownProps) {
  const [viewMode, setViewMode] = useState<
    "weekly" | "distribution" | "details"
  >("weekly");

  const { weeklyData, stats } = useMemo(() => {
    // 実際のサイクルタイム分解データを使用
    const weeklyData: CycleTimeData[] = data.cycleTimeBreakdown.map(
      (breakdown) => ({
        week: breakdown.week,
        avgTimeToFirstReview: breakdown.avgTimeToFirstReview,
        avgReviewTime: breakdown.avgReviewTime,
        avgTimeToMerge: breakdown.avgTimeToMerge,
        avgTotalCycleTime: breakdown.avgTotalCycleTime,
        totalPRs: breakdown.totalPRs,
        bottleneckType: breakdown.bottleneckType,
      })
    );

    // 統計情報を計算
    const allCycleTimes = weeklyData
      .map((w) => w.avgTotalCycleTime)
      .filter((t) => t > 0);
    const allMedianTimes = data.cycleTimeBreakdown
      .map((d) => d.medianCycleTime)
      .filter((t) => t > 0);
    const allP95Times = data.cycleTimeBreakdown
      .map((d) => d.p95CycleTime)
      .filter((t) => t > 0);

    const stats = {
      avgCycleTime:
        allCycleTimes.length > 0
          ? allCycleTimes.reduce((a, b) => a + b, 0) / allCycleTimes.length
          : 0,
      medianCycleTime:
        allMedianTimes.length > 0
          ? allMedianTimes.reduce((a, b) => a + b, 0) / allMedianTimes.length
          : 0,
      p95CycleTime:
        allP95Times.length > 0
          ? allP95Times.reduce((a, b) => a + b, 0) / allP95Times.length
          : 0,
      totalPRs: weeklyData.reduce((sum, w) => sum + w.totalPRs, 0),
    };

    return { weeklyData, stats };
  }, [data]);

  const formatTooltip = (value: number, name: string) => {
    const nameMap: { [key: string]: string } = {
      avgTimeToFirstReview: "レビュー待ち時間",
      avgReviewTime: "レビュー時間",
      avgTimeToMerge: "マージ待ち時間",
      avgTotalCycleTime: "総サイクル時間",
    };
    return [`${value.toFixed(1)}時間`, nameMap[name] || name];
  };

  const formatXAxis = (tickItem: string) => {
    return formatWeekDisplay(tickItem);
  };

  const getBottleneckColor = (type: CycleTimeData["bottleneckType"]) => {
    switch (type) {
      case "review-wait":
        return "#ef4444";
      case "review-process":
        return "#f97316";
      case "merge-wait":
        return "#eab308";
      default:
        return "#6b7280";
    }
  };

  const bottleneckCounts = weeklyData.reduce((acc, week) => {
    acc[week.bottleneckType] = (acc[week.bottleneckType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (weeklyData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          ⏱️ サイクルタイム分解分析
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          マージされたPRのデータが不足しています。分析には更多くのマージされたPRが必要です。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ⏱️ サイクルタイム分解分析
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            PRの作成からマージまでの時間を、プロセス別に分解してボトルネックを特定します。
          </p>
        </div>

        <div className="flex gap-2 mt-4 lg:mt-0">
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "weekly"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            週次推移
          </button>
          <button
            onClick={() => setViewMode("distribution")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "distribution"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            ボトルネック分析
          </button>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            平均サイクルタイム
          </h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.avgCycleTime.toFixed(1)}h
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
            中央値
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.medianCycleTime.toFixed(1)}h
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
            95パーセンタイル
          </h3>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {stats.p95CycleTime.toFixed(1)}h
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
            分析対象PR数
          </h3>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {stats.totalPRs}
          </p>
        </div>
      </div>

      {viewMode === "weekly" && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 週次サイクルタイム分解
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="week"
                  tickFormatter={formatXAxis}
                  className="text-xs"
                />
                <YAxis
                  label={{ value: "時間", angle: -90, position: "insideLeft" }}
                  className="text-xs"
                />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar
                  dataKey="avgTimeToFirstReview"
                  stackId="cycle"
                  fill={CYCLE_TIME_COLORS["review-wait"]}
                  name="レビュー待ち時間"
                />
                <Bar
                  dataKey="avgReviewTime"
                  stackId="cycle"
                  fill={CYCLE_TIME_COLORS["review-process"]}
                  name="レビュー時間"
                />
                <Bar
                  dataKey="avgTimeToMerge"
                  stackId="cycle"
                  fill={CYCLE_TIME_COLORS["merge-wait"]}
                  name="マージ待ち時間"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === "distribution" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎯 ボトルネック分析
            </h3>
            <div className="space-y-3">
              {Object.entries(bottleneckCounts).map(([type, count]) => {
                const percentage = (count / weeklyData.length) * 100;
                const labels = {
                  "review-wait": "レビュー待ち",
                  "review-process": "レビュー処理",
                  "merge-wait": "マージ待ち",
                  balanced: "バランス良好",
                };
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: getBottleneckColor(
                            type as CycleTimeData["bottleneckType"]
                          ),
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {labels[type as keyof typeof labels]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {count}週 ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 サイクルタイム推移
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatXAxis}
                    className="text-xs"
                  />
                  <YAxis
                    label={{
                      value: "時間",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    className="text-xs"
                  />
                  <Tooltip formatter={formatTooltip} />
                  <Line
                    type="monotone"
                    dataKey="avgTotalCycleTime"
                    stroke={CYCLE_TIME_COLORS.total}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="総サイクル時間"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* アクションアイテム */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
          🎯 改善アクション
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>
            • <strong>レビュー待ち時間が長い場合:</strong>{" "}
            レビュアーのアサイン自動化、レビュー依頼の通知改善を検討
          </li>
          <li>
            • <strong>レビュー時間が長い場合:</strong> PR
            サイズの適正化、事前のデザインレビュー強化を検討
          </li>
          <li>
            • <strong>マージ待ち時間が長い場合:</strong> CI/CD
            の最適化、マージ権限の分散を検討
          </li>
          <li>
            • <strong>全体的な改善:</strong>{" "}
            ペアプログラミング、小さなPRの推奨、非同期レビューの活用
          </li>
        </ul>
      </div>
    </div>
  );
}
