import React from "react";
import { CommentInteraction, DateRange } from "@/types/analytics";

interface CommentInteractionsProps {
  mainInteractions: CommentInteraction[];
  comparisonInteractions?: CommentInteraction[];
  selectedRange: DateRange;
  comparisonRange?: DateRange | null;
}

const CommentInteractions: React.FC<CommentInteractionsProps> = ({
  mainInteractions,
  comparisonInteractions = [],
  selectedRange,
  comparisonRange,
}) => {
  if (mainInteractions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        💬 Top Comment Interactions
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        📝 Issue Comments + 🔍 Review Comments の合計でカウント
      </p>

      {comparisonInteractions.length > 0 ? (
        /* 比較表示 - 左右に並べる */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* メイン期間 */}
          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">
              📊 メイン期間: {selectedRange.label}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2">From → To</th>
                    <th className="text-left py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {mainInteractions.map((interaction, index) => (
                    <tr
                      key={`main-${index}`}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <img
                            src={interaction.fromAvatar}
                            alt={interaction.from}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-xs">{interaction.from}</span>
                          <span className="text-gray-400">→</span>
                          <img
                            src={interaction.toAvatar}
                            alt={interaction.to}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-xs">{interaction.to}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="font-semibold text-blue-600">
                          {interaction.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 比較期間 */}
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-3">
              📊 比較期間: {comparisonRange?.label}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2">From → To</th>
                    <th className="text-left py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonInteractions.map((interaction, index) => (
                    <tr
                      key={`comparison-${index}`}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <img
                            src={interaction.fromAvatar}
                            alt={interaction.from}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-xs">{interaction.from}</span>
                          <span className="text-gray-400">→</span>
                          <img
                            src={interaction.toAvatar}
                            alt={interaction.to}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-xs">{interaction.to}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="font-semibold text-green-600">
                          {interaction.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 単一期間表示 */
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-600">
                <th className="text-left py-3">From → To</th>
                <th className="text-left py-3">Comments</th>
              </tr>
            </thead>
            <tbody>
              {mainInteractions.map((interaction, index) => (
                <tr key={index} className="border-b dark:border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={interaction.fromAvatar}
                        alt={interaction.from}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{interaction.from}</span>
                      <span className="text-gray-400 text-xl">→</span>
                      <img
                        src={interaction.toAvatar}
                        alt={interaction.to}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{interaction.to}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full font-semibold">
                      {interaction.count} comments
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommentInteractions;
