"use client";

import React, { useState } from "react";
import { subWeeks, format } from "date-fns";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
  onComparisonChange?: (range: DateRange | null) => void;
  selectedRange: DateRange;
  comparisonRange?: DateRange | null;
  enableComparison?: boolean;
}

const PRESET_RANGES = [
  { value: "1w", label: "直近1週間", weeks: 1 },
  { value: "1m", label: "直近1ヶ月", weeks: 4 },
  { value: "3m", label: "直近3ヶ月", weeks: 12 },
  { value: "6m", label: "直近半年", weeks: 26 },
  { value: "1y", label: "直近1年", weeks: 52 },
];

export default function DateRangeSelector({
  onDateRangeChange,
  onComparisonChange,
  selectedRange,
  comparisonRange,
  enableComparison = false,
}: DateRangeSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonFrom, setComparisonFrom] = useState("");
  const [comparisonTo, setComparisonTo] = useState("");

  const getCurrentWeekRange = (weeks: number): DateRange => {
    const now = new Date();
    const to = format(now, "yyyy-MM-dd");
    const from = format(subWeeks(now, weeks), "yyyy-MM-dd");
    return { from, to, label: `${weeks}週間` };
  };

  const handlePresetChange = (preset: string) => {
    setIsCustom(false);
    const range = PRESET_RANGES.find((p) => p.value === preset);
    if (range) {
      const dateRange = getCurrentWeekRange(range.weeks);
      dateRange.label = range.label;
      onDateRangeChange(dateRange);
    }
  };

  const handleCustomSubmit = () => {
    if (customFrom && customTo) {
      const range: DateRange = {
        from: customFrom,
        to: customTo,
        label: `${customFrom} ~ ${customTo}`,
      };
      onDateRangeChange(range);
    }
  };

  const handleComparisonSubmit = () => {
    if (comparisonFrom && comparisonTo && onComparisonChange) {
      const range: DateRange = {
        from: comparisonFrom,
        to: comparisonTo,
        label: `比較期間: ${comparisonFrom} ~ ${comparisonTo}`,
      };
      onComparisonChange(range);
    }
  };

  const clearComparison = () => {
    if (onComparisonChange) {
      onComparisonChange(null);
      setShowComparison(false);
      setComparisonFrom("");
      setComparisonTo("");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📅 期間選択
      </h3>

      {/* メイン期間選択 */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          分析期間
        </h4>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_RANGES.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRange.label === preset.label
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustom(true)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCustom
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            カスタム期間
          </button>
        </div>

        {isCustom && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customFrom || !customTo}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          現在の期間: <span className="font-medium">{selectedRange.label}</span>
          {selectedRange.from && selectedRange.to && (
            <span className="ml-2">
              ({selectedRange.from} ~ {selectedRange.to})
            </span>
          )}
        </div>
      </div>

      {/* 比較機能 */}
      {enableComparison && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
              期間比較
            </h4>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-800 dark:text-green-200"
            >
              {showComparison ? "比較を非表示" : "比較期間を設定"}
            </button>
          </div>

          {showComparison && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    比較期間 開始日
                  </label>
                  <input
                    type="date"
                    value={comparisonFrom}
                    onChange={(e) => setComparisonFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    比較期間 終了日
                  </label>
                  <input
                    type="date"
                    value={comparisonTo}
                    onChange={(e) => setComparisonTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleComparisonSubmit}
                    disabled={!comparisonFrom || !comparisonTo}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    比較開始
                  </button>
                  {comparisonRange && (
                    <button
                      onClick={clearComparison}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>

              {comparisonRange && (
                <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                  比較期間:{" "}
                  <span className="font-medium">{comparisonRange.label}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
