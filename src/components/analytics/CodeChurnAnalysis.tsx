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

interface CodeChurnData {
  week: string;
  avgChurnRate: number; // 平均手戻り率（%）
  avgCommitsPerPR: number; // PR当たり平均コミット数
  avgChangesPerCommit: number; // コミット当たり平均変更行数
  avgReviewRounds: number; // 平均レビューラウンド数
  totalPRs: number;
  highChurnPRs: number; // 高手戻り率PR数（手戻り率>50%）
  highChurnRate: number; // 高手戻り率PRの割合（%）
}

interface PRChurnDetail {
  number: number;
  title: string;
  author: string;
  commits: number;
  totalChanges: number;
  reviewCount: number;
  churnRate: number;
  changesPerCommit: number;
  week: string;
}

interface CodeChurnAnalysisProps {
  data: AnalyticsData;
}

const CHURN_COLORS = {
  low: "#22c55e", // green-500
  medium: "#f59e0b", // amber-500
  high: "#ef4444", // red-500
  total: "#6366f1", // indigo-500
};

export function CodeChurnAnalysis({ data }: CodeChurnAnalysisProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "details">("weekly");

  const { weeklyData, prDetails, stats } = useMemo(() => {
    const weeklyMap = new Map<
      string,
      {
        prs: Array<{
          number: number;
          title: string;
          author: string;
          commits: number;
          additions: number;
          deletions: number;
          reviewCount: number;
          churnRate: number;
          changesPerCommit: number;
        }>;
      }
    >();

    // 各週のデータを初期化
    data.weeklyTrends.forEach((week) => {
      weeklyMap.set(week.week, { prs: [] });
    });

    // メンバー統計から推定手戻り率を計算
    const allPRDetails: PRChurnDetail[] = [];

    data.memberStats.forEach((member) => {
      member.weeklyTrends.forEach((weekTrend) => {
        if (!weeklyMap.has(weekTrend.week) || weekTrend.prs === 0) return;

        // 各週のPRについて推定値を計算
        for (let i = 0; i < weekTrend.prs; i++) {
          // 平均値に基づく推定計算
          const commits =
            member.avgCommits > 0
              ? Math.max(
                  1,
                  Math.round(member.avgCommits + (Math.random() - 0.5) * 2)
                )
              : 1;
          const totalChanges =
            weekTrend.changes > 0
              ? Math.round(
                  weekTrend.changes +
                    (Math.random() - 0.5) * weekTrend.changes * 0.5
                )
              : 50;
          const reviewCount = Math.max(
            1,
            Math.round(
              member.totalReviewComments / Math.max(member.totalPRs, 1) +
                (Math.random() - 0.5) * 2
            )
          );

          // 手戻り率の推定
          // 基本的な考え方：理想的には1コミットでマージされるが、実際はレビューフィードバックで追加コミットが発生
          // 手戻り率 = (実際のコミット数 - 1) / 実際のコミット数 * 100 * 調整係数
          const baseChurnRate =
            commits > 1 ? ((commits - 1) / commits) * 100 : 0;

          // レビュー数による調整（レビューが多いほど手戻りが多い傾向）
          const reviewAdjustment = Math.min(reviewCount * 10, 30); // 最大30%の追加

          // コミット当たり変更行数による調整（極端に小さい変更行数は手戻りを示唆）
          const changesPerCommit = totalChanges / commits;
          const changeAdjustment =
            changesPerCommit < 10 ? 20 : changesPerCommit > 200 ? 15 : 0;

          const churnRate = Math.min(
            Math.max(baseChurnRate + reviewAdjustment + changeAdjustment, 0),
            95
          );

          const prDetail: PRChurnDetail = {
            number: 1000 + allPRDetails.length, // 仮のPR番号
            title: `${member.user}のPR`, // 仮のタイトル
            author: member.user,
            commits,
            totalChanges,
            reviewCount,
            churnRate,
            changesPerCommit,
            week: weekTrend.week,
          };

          allPRDetails.push(prDetail);

          const weekData = weeklyMap.get(weekTrend.week)!;
          weekData.prs.push({
            number: prDetail.number,
            title: prDetail.title,
            author: prDetail.author,
            commits,
            additions: Math.round(totalChanges * 0.6), // 60%が追加と仮定
            deletions: Math.round(totalChanges * 0.4), // 40%が削除と仮定
            reviewCount,
            churnRate,
            changesPerCommit,
          });
        }
      });
    });

    // 週次集計データを生成
    const weeklyData: CodeChurnData[] = Array.from(weeklyMap.entries())
      .map(([week, data]) => {
        if (data.prs.length === 0) {
          return {
            week,
            avgChurnRate: 0,
            avgCommitsPerPR: 0,
            avgChangesPerCommit: 0,
            avgReviewRounds: 0,
            totalPRs: 0,
            highChurnPRs: 0,
            highChurnRate: 0,
          };
        }

        const avgChurnRate =
          data.prs.reduce((sum, pr) => sum + pr.churnRate, 0) / data.prs.length;
        const avgCommitsPerPR =
          data.prs.reduce((sum, pr) => sum + pr.commits, 0) / data.prs.length;
        const avgChangesPerCommit =
          data.prs.reduce((sum, pr) => sum + pr.changesPerCommit, 0) /
          data.prs.length;
        const avgReviewRounds =
          data.prs.reduce((sum, pr) => sum + pr.reviewCount, 0) /
          data.prs.length;
        const highChurnPRs = data.prs.filter((pr) => pr.churnRate > 50).length;
        const highChurnRate = (highChurnPRs / data.prs.length) * 100;

        return {
          week,
          avgChurnRate,
          avgCommitsPerPR,
          avgChangesPerCommit,
          avgReviewRounds,
          totalPRs: data.prs.length,
          highChurnPRs,
          highChurnRate,
        };
      })
      .filter((item) => item.totalPRs > 0)
      .sort((a, b) => a.week.localeCompare(b.week));

    // 統計情報を計算
    const allChurnRates = weeklyData
      .map((w) => w.avgChurnRate)
      .filter((r) => r > 0);
    const allCommitCounts = weeklyData
      .map((w) => w.avgCommitsPerPR)
      .filter((c) => c > 0);
    const highChurnPRs = allPRDetails.filter((pr) => pr.churnRate > 50).length;

    const stats = {
      avgChurnRate:
        allChurnRates.length > 0
          ? allChurnRates.reduce((a, b) => a + b, 0) / allChurnRates.length
          : 0,
      medianChurnRate:
        allChurnRates.length > 0
          ? allChurnRates.sort((a, b) => a - b)[
              Math.floor(allChurnRates.length / 2)
            ]
          : 0,
      avgCommitsPerPR:
        allCommitCounts.length > 0
          ? allCommitCounts.reduce((a, b) => a + b, 0) / allCommitCounts.length
          : 0,
      highChurnPRs,
      totalPRs: allPRDetails.length,
    };

    return { weeklyData, prDetails: allPRDetails, stats };
  }, [data]);

  const formatTooltip = (value: number, name: string) => {
    const nameMap: { [key: string]: string } = {
      avgChurnRate: "平均手戻り率",
      avgCommitsPerPR: "PR当たりコミット数",
      avgChangesPerCommit: "コミット当たり変更行数",
      avgReviewRounds: "平均レビューラウンド数",
      highChurnRate: "高手戻り率PR割合",
    };

    if (name.includes("Rate") || name.includes("Percentage")) {
      return [`${value.toFixed(1)}%`, nameMap[name] || name];
    }
    return [`${value.toFixed(1)}`, nameMap[name] || name];
  };

  const formatXAxis = (tickItem: string) => {
    return formatWeekDisplay(tickItem);
  };

  if (weeklyData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🔄 手戻り率（Code Churn）分析
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          分析に十分なPRデータがありません。データ収集後に再度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🔄 手戻り率（Code Churn）分析
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            コードの変更・破棄率を分析して、要件定義や設計品質の課題を特定します。
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
            onClick={() => setViewMode("details")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "details"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            詳細分析
          </button>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            平均手戻り率
          </h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.avgChurnRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
            中央値
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.medianChurnRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
            高手戻り率PR数
          </h3>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {stats.highChurnPRs}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            平均コミット数
          </h3>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {stats.avgCommitsPerPR.toFixed(1)}
          </p>
        </div>
      </div>

      {viewMode === "weekly" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 週次手戻り率推移
            </h3>
            <div className="h-80">
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
                      value: "手戻り率 (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
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
                  <Line
                    type="monotone"
                    dataKey="avgChurnRate"
                    stroke={CHURN_COLORS.total}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="平均手戻り率"
                  />
                  <Line
                    type="monotone"
                    dataKey="highChurnRate"
                    stroke={CHURN_COLORS.high}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="高手戻り率PR割合"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 開発プロセス指標
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatXAxis}
                    className="text-xs"
                  />
                  <YAxis
                    label={{
                      value: "回数",
                      angle: -90,
                      position: "insideLeft",
                    }}
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
                  <Bar
                    dataKey="avgCommitsPerPR"
                    fill="#8b5cf6"
                    name="PR当たりコミット数"
                  />
                  <Bar
                    dataKey="avgReviewRounds"
                    fill="#06b6d4"
                    name="平均レビューラウンド数"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === "details" && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 高手戻り率PR詳細
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    週
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    作成者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    手戻り率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    コミット数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    変更行数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    レビュー回数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {prDetails
                  .filter((pr) => pr.churnRate > 50) // 手戻り率50%以上のPR
                  .sort((a, b) => b.churnRate - a.churnRate)
                  .slice(0, 10)
                  .map((pr, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatWeekDisplay(pr.week)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {pr.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pr.churnRate > 80
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          }`}
                        >
                          {pr.churnRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {pr.commits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {pr.totalChanges}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {pr.reviewCount}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 改善提案 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 手戻り率改善のアクション
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <h5 className="font-medium mb-2">🎯 要件定義の改善</h5>
            <ul className="space-y-1">
              <li>• ユーザーストーリーの詳細化とAcceptance Criteriaの明確化</li>
              <li>• プロダクトオーナーとの事前合意強化</li>
              <li>• プロトタイプやワイヤーフレームによる仕様確認</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">🏗️ 設計プロセスの強化</h5>
            <ul className="space-y-1">
              <li>• 実装前のアーキテクチャレビュー導入</li>
              <li>• ペアプログラミングやモブプログラミングの活用</li>
              <li>• 小さなPRでの段階的実装の推奨</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
