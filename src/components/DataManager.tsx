"use client";

import { useState } from "react";
import useSWR from "swr";

interface DataInfo {
  owner: string;
  repo: string;
  currentWeek: string;
  lastCollectedWeek: string | null;
  availableWeeks: string[];
  recentWeeks: string[];
  totalWeeks: number;
}

interface CollectionResult {
  message: string;
  week: string;
  prCount: number;
}

export default function DataManager({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<CollectionResult | null>(
    null
  );

  const {
    data: dataInfo,
    error,
    mutate,
  } = useSWR<DataInfo>(
    owner && repo ? `/api/collect-data?owner=${owner}&repo=${repo}` : null,
    (url: string) => fetch(url).then((res) => res.json())
  );

  const collectWeekData = async (week?: string) => {
    setCollecting(true);
    setCollectResult(null);

    try {
      const response = await fetch("/api/collect-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo, week }),
      });

      const result = await response.json();

      if (response.ok) {
        setCollectResult(result);
        mutate(); // データ情報を再取得
      } else {
        throw new Error(result.error || "データ収集に失敗しました");
      }
    } catch (error) {
      console.error("データ収集エラー:", error);
      alert(
        error instanceof Error ? error.message : "データ収集に失敗しました"
      );
    } finally {
      setCollecting(false);
    }
  };

  const collectMultipleWeeks = async () => {
    if (!dataInfo) return;

    setCollecting(true);
    const results: CollectionResult[] = [];

    for (const week of dataInfo.recentWeeks) {
      if (!dataInfo.availableWeeks.includes(week)) {
        try {
          const response = await fetch("/api/collect-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ owner, repo, week }),
          });

          const result = await response.json();
          if (response.ok) {
            results.push(result);
          }
        } catch (error) {
          console.error(`週 ${week} のデータ収集エラー:`, error);
        }
      }
    }

    setCollecting(false);
    mutate();

    if (results.length > 0) {
      alert(`${results.length}週のデータを収集しました`);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800">
          データ情報の取得に失敗しました
        </h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!dataInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const missingWeeks = dataInfo.recentWeeks.filter(
    (week) => !dataInfo.availableWeeks.includes(week)
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-blue-800 mb-4">📊 データ管理</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-sm text-gray-600">現在の週</div>
          <div className="font-semibold">{dataInfo.currentWeek}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-sm text-gray-600">最後に収集した週</div>
          <div className="font-semibold">
            {dataInfo.lastCollectedWeek || "未収集"}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-sm text-gray-600">保存済み週数</div>
          <div className="font-semibold">{dataInfo.totalWeeks}週</div>
        </div>
        <div className="bg-white rounded-lg p-3 border">
          <div className="text-sm text-gray-600">未収集週数</div>
          <div className="font-semibold text-orange-600">
            {missingWeeks.length}週
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => collectWeekData()}
          disabled={collecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {collecting ? "収集中..." : "今週のデータを収集"}
        </button>

        {missingWeeks.length > 0 && (
          <button
            onClick={collectMultipleWeeks}
            disabled={collecting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {collecting
              ? "収集中..."
              : `未収集データを一括収集 (${missingWeeks.length}週)`}
          </button>
        )}
      </div>

      {missingWeeks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-orange-800 mb-2">未収集の週:</h4>
          <div className="flex flex-wrap gap-2">
            {missingWeeks.map((week) => (
              <button
                key={week}
                onClick={() => collectWeekData(week)}
                disabled={collecting}
                className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 disabled:bg-gray-200"
              >
                {week}
              </button>
            ))}
          </div>
        </div>
      )}

      {dataInfo.availableWeeks.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-800 mb-2">
            収集済みの週 (最新20週):
          </h4>
          <div className="flex flex-wrap gap-2">
            {dataInfo.availableWeeks.slice(-20).map((week) => (
              <span
                key={week}
                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {week}
              </span>
            ))}
            {dataInfo.availableWeeks.length > 20 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                他{dataInfo.availableWeeks.length - 20}週
              </span>
            )}
          </div>
        </div>
      )}

      {collectResult && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-800">✅ 収集完了</h4>
          <p className="text-green-700 text-sm">
            週 {collectResult.week}: {collectResult.prCount}{" "}
            件のPRを収集しました
          </p>
        </div>
      )}
    </div>
  );
}
