"use client";

import React, { useState } from "react";
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
  data: unknown;
}

import { isRestrictedEnvironment } from "@/lib/environment";

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

  // ローカル環境でのみデータ収集機能を有効化（現在は使用していない）
  // const isLocalEnvironment = process.env.NODE_ENV === "development";

  const {
    data: dataInfo,
    error,
    mutate,
  } = useSWR<DataInfo>(
    owner && repo ? `/api/collect-data?owner=${owner}&repo=${repo}` : null,
    (url: string) => fetch(url).then((res) => res.json())
  );

  const collectWeekData = async (week?: string) => {
    if (isRestrictedEnvironment()) {
      alert(
        "データ収集は本番環境では利用できません。ローカル環境でデータを収集してからデプロイしてください。"
      );
      return;
    }

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

  const collectAllRecentData = async () => {
    if (isRestrictedEnvironment()) {
      alert(
        "データ収集は本番環境では利用できません。ローカル環境でデータを収集してからデプロイしてください。"
      );
      return;
    }

    if (!dataInfo) return;

    setCollecting(true);
    setCollectResult(null);

    try {
      // 未収集の週を特定
      const collectedWeeks = new Set(dataInfo.availableWeeks);
      const uncollectedWeeks = dataInfo.recentWeeks.filter(
        (week) => !collectedWeeks.has(week)
      );

      if (uncollectedWeeks.length === 0) {
        alert("収集可能なデータはありません。");
        return;
      }

      // 各週のデータを順次収集
      for (const week of uncollectedWeeks) {
        console.log(`Collecting data for week ${week}...`);
        await collectWeekData(week);
        // 少し待機してAPI制限を回避
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      alert(`${uncollectedWeeks.length}週間のデータ収集が完了しました。`);
      mutate(); // データ情報を再取得
    } catch (error) {
      console.error("一括データ収集エラー:", error);
      alert("一括データ収集に失敗しました。");
    } finally {
      setCollecting(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-red-800 mb-2">
          ❌ データ情報の取得に失敗しました
        </h3>
        <p className="text-red-700 text-sm">エラー: {error.message}</p>
      </div>
    );
  }

  if (!dataInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          📊 データ管理
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {dataInfo.totalWeeks}週間のデータ
        </div>
      </div>

      {isRestrictedEnvironment() && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ 本番環境での制限
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
            データ収集機能は本番環境では利用できません。
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            ローカル環境で{" "}
            <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">
              npm run update-data
            </code>{" "}
            を実行してからデプロイしてください。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            現在の状況
          </h3>
          <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <div>現在の週: {dataInfo.currentWeek}</div>
            <div>最新データ: {dataInfo.lastCollectedWeek || "なし"}</div>
            <div>利用可能週数: {dataInfo.totalWeeks}</div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
            クイックアクション
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => collectWeekData()}
              disabled={collecting || isRestrictedEnvironment()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {collecting ? "収集中..." : "今週のデータを収集"}
            </button>
            <button
              onClick={collectAllRecentData}
              disabled={collecting || isRestrictedEnvironment()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {collecting ? "収集中..." : "未収集データを一括収集"}
            </button>
          </div>
        </div>
      </div>

      {collectResult && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            ✅ データ収集完了
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">
            {collectResult.message} ({collectResult.prCount}件のPR)
          </p>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          週別データ状況
        </h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
          {dataInfo.recentWeeks.slice(-24).map((week) => {
            const isCollected = dataInfo.availableWeeks.includes(week);
            const isCurrent = week === dataInfo.currentWeek;
            return (
              <button
                key={week}
                onClick={() => !isCollected && collectWeekData(week)}
                disabled={collecting || isRestrictedEnvironment()}
                className={`
                  p-2 text-xs rounded transition-colors
                  ${
                    isCollected
                      ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                      : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500"
                  }
                  ${isCurrent ? "ring-2 ring-blue-500" : ""}
                  ${
                    collecting || isRestrictedEnvironment()
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }
                `}
                title={`${week}${isCollected ? " (収集済み)" : " (未収集)"}`}
              >
                {week.split("-W")[1]}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block w-3 h-3 bg-green-100 dark:bg-green-800 rounded mr-1"></span>
          収集済み
          <span className="inline-block w-3 h-3 bg-gray-100 dark:bg-gray-600 rounded ml-3 mr-1"></span>
          未収集
          <span className="inline-block w-3 h-3 bg-blue-500 rounded ml-3 mr-1 ring-2 ring-blue-500"></span>
          現在の週
        </div>
      </div>
    </div>
  );
}
