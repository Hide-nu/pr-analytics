import React, { useState } from "react";
import { useComparisonData, type DateRange } from "@/hooks/useGitHubData";
import AnalyticsDashboard from "./AnalyticsDashboard";
import DataManager from "./DataManager";
import DateRangeSelector from "./DateRangeSelector";
import { subWeeks, format } from "date-fns";

interface DashboardProps {
  owner: string;
  repo: string;
}

const Dashboard: React.FC<DashboardProps> = ({ owner, repo }) => {
  // デフォルトは直近1ヶ月
  const [selectedRange, setSelectedRange] = useState<DateRange>(() => {
    const now = new Date();
    const to = format(now, "yyyy-MM-dd");
    const from = format(subWeeks(now, 4), "yyyy-MM-dd");
    return { from, to, label: "直近1ヶ月" };
  });

  const [comparisonRange, setComparisonRange] = useState<DateRange | null>(
    null
  );

  const {
    mainData: analyticsData,
    comparisonData,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useComparisonData(owner, repo, selectedRange, comparisonRange);

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedRange(range);
  };

  const handleComparisonChange = (range: DateRange | null) => {
    setComparisonRange(range);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {owner}/{repo}
        </h1>
        <p className="text-gray-600 mt-2">
          GitHub Pull Request Analytics - 週次データ蓄積システム
        </p>
      </div>

      <DataManager owner={owner} repo={repo} />

      <DateRangeSelector
        onDateRangeChange={handleDateRangeChange}
        onComparisonChange={handleComparisonChange}
        selectedRange={selectedRange}
        comparisonRange={comparisonRange}
        enableComparison={true}
      />

      {analyticsLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">詳細分析データを読み込み中...</div>
        </div>
      ) : analyticsError || !analyticsData ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">
            📥 データが見つかりません
          </h3>
          <p className="text-yellow-700 mb-4">
            分析を開始するには、まず上のデータ管理セクションでデータを収集してください。
          </p>
          <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
            <li>「今週のデータを収集」ボタンで最新の週のデータを取得</li>
            <li>
              「未収集データを一括収集」ボタンで過去1年間（52週間）のデータを一括取得
            </li>
            <li>個別の週をクリックして特定の週のデータを収集</li>
          </ul>
        </div>
      ) : (
        <AnalyticsDashboard
          data={analyticsData}
          comparisonData={comparisonData}
          selectedRange={selectedRange}
          comparisonRange={comparisonRange}
        />
      )}
    </div>
  );
};

export default Dashboard;
