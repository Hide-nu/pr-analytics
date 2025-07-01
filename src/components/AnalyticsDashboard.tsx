"use client";

import React, { useState } from "react";
import { AnalyticsDashboardProps } from "@/types/analytics";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";

// 分離したコンポーネントをインポート
import UserExcludeSettings from "./analytics/UserExcludeSettings";
import ComparisonSummary from "./analytics/ComparisonSummary";
import OverallMetrics from "./analytics/OverallMetrics";
import OverallMetricsChart from "./analytics/OverallMetricsChart";
import TrendsAnalysis from "./analytics/TrendsAnalysis";
import LabelStatistics from "./analytics/LabelStatistics";
import { LabelTimelineChart } from "./analytics/LabelTimelineChart";
import { CycleTimeBreakdown } from "./analytics/CycleTimeBreakdown";
import { CodeChurnAnalysis } from "./analytics/CodeChurnAnalysis";
import WeeklyTrends from "./analytics/WeeklyTrends";
import MemberStatistics from "./analytics/MemberStatistics";
import MemberDetailView from "./analytics/MemberDetailView";
import CommentInteractions from "./analytics/CommentInteractions";
import DataExportControls from "./analytics/DataExportControls";

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  comparisonData,
  selectedRange,
  comparisonRange,
}) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // カスタムフックからフィルタリング機能を取得
  const {
    excludedUsers,
    showUserExcludeSettings,
    setShowUserExcludeSettings,
    getAllUsersFromData,
    filterData,
    aggregateCommentInteractions,
    toggleUserExclusion,
  } = useAnalyticsFilters();

  // 全ユーザーリストを取得
  const allUsers = Array.from(
    new Set([
      ...getAllUsersFromData(data),
      ...(comparisonData ? getAllUsersFromData(comparisonData) : []),
    ])
  ).sort();

  // フィルタリングされたデータ
  const filteredData = filterData(data);
  const filteredComparisonData = comparisonData
    ? filterData(comparisonData)
    : undefined;

  // コメントインタラクションデータ
  const mainInteractions = aggregateCommentInteractions(data);
  const comparisonInteractions = comparisonData
    ? aggregateCommentInteractions(comparisonData)
    : [];

  if (data.labelStats === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* ユーザー除外設定 */}
      <UserExcludeSettings
        allUsers={allUsers}
        excludedUsers={excludedUsers}
        showUserExcludeSettings={showUserExcludeSettings}
        onToggleSettings={() =>
          setShowUserExcludeSettings(!showUserExcludeSettings)
        }
        onToggleUserExclusion={toggleUserExclusion}
      />

      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Pull Request Analytics Report
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          <strong>Repository</strong>: {data.repository.owner}/
          {data.repository.name}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          <strong>Data Range</strong>: {selectedRange.label} (
          {data.dataRange.totalWeeks}週)
          {comparisonRange && (
            <span className="ml-4 text-green-600">
              vs {comparisonRange.label}
            </span>
          )}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          <strong>Last Updated</strong>:{" "}
          {new Date(data.lastUpdated).toLocaleString("ja-JP")}
        </p>
      </div>

      {/* 比較サマリー */}
      {comparisonData && (
        <ComparisonSummary
          data={filteredData}
          comparisonData={filteredComparisonData!}
        />
      )}

      {/* 全体メトリクス */}
      <OverallMetrics
        data={filteredData}
        comparisonData={filteredComparisonData}
      />

      {/* 全体指標グラフ比較 */}
      {comparisonData && (
        <OverallMetricsChart
          data={filteredData}
          comparisonData={filteredComparisonData!}
        />
      )}

      {/* 全体トレンド分析 */}
      <TrendsAnalysis
        data={filteredData}
        comparisonData={filteredComparisonData}
      />

      {/* ラベル統計 */}
      <LabelStatistics data={filteredData} />

      {/* ラベル時系列分析 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🏷️ ラベル分類の時系列分析
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          バグ修正、技術的負債、リファクタリングなど、PR分類の推移を追跡します。
          品質改善や負債返済への投資状況を可視化できます。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📊 件数ベース
            </h3>
            <LabelTimelineChart
              data={filteredData.labelTimeline}
              showPercentage={false}
              chartType="bar"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📈 割合ベース
            </h3>
            <LabelTimelineChart
              data={filteredData.labelTimeline}
              showPercentage={true}
              chartType="line"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            💡 活用のヒント
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• バグ修正PRの増加は品質問題の兆候として早期対応を検討</li>
            <li>
              • 技術的負債やリファクタリングPRが継続的にあることで健全性を保持
            </li>
            <li>• 機能追加PRの割合から新機能開発のペースを把握</li>
          </ul>
        </div>
      </div>

      {/* サイクルタイム分解分析 */}
      <CycleTimeBreakdown data={filteredData} />

      {/* 手戻り率（Code Churn）分析 */}
      <CodeChurnAnalysis data={filteredData} />

      {/* 週次トレンド */}
      <WeeklyTrends data={filteredData} />

      {/* メンバー統計 */}
      <MemberStatistics
        data={filteredData}
        onMemberSelect={setSelectedMember}
        selectedMember={selectedMember}
      />

      {/* 選択されたメンバーの詳細 */}
      {selectedMember && (
        <MemberDetailView
          member={
            filteredData.memberStats.find((m) => m.user === selectedMember)!
          }
          onClose={() => setSelectedMember(null)}
          comparisonData={filteredComparisonData}
          selectedRange={selectedRange}
          comparisonRange={comparisonRange}
        />
      )}

      {/* コメントインタラクション */}
      <CommentInteractions
        mainInteractions={mainInteractions}
        comparisonInteractions={comparisonInteractions}
        selectedRange={selectedRange}
        comparisonRange={comparisonRange}
      />

      {/* データエクスポート */}
      <DataExportControls
        repositoryOwner={data.repository.owner}
        repositoryName={data.repository.name}
      />
    </div>
  );
};

export default AnalyticsDashboard;
