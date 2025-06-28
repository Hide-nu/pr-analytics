"use client";

import React, { useState } from "react";
import { AnalyticsDashboardProps } from "@/types/analytics";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";

// 分離したコンポーネントをインポート
import UserExcludeSettings from "./analytics/UserExcludeSettings";
import ComparisonSummary from "./analytics/ComparisonSummary";
import OverallMetrics from "./analytics/OverallMetrics";
import TrendsAnalysis from "./analytics/TrendsAnalysis";
import LabelStatistics from "./analytics/LabelStatistics";
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

      {/* 全体トレンド分析 */}
      <TrendsAnalysis
        data={filteredData}
        comparisonData={filteredComparisonData}
      />

      {/* ラベル統計 */}
      <LabelStatistics data={filteredData} />

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
