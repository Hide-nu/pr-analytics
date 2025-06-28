"use client";

import { useState } from "react";
import { AnalyticsData, CommentInteraction } from "@/types/analytics";

export const useAnalyticsFilters = () => {
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);
  const [showUserExcludeSettings, setShowUserExcludeSettings] = useState(false);

  // 全ユーザーリストを取得（memberStatsとcommentInteractionsの両方から）
  const getAllUsersFromData = (analyticsData: AnalyticsData) => {
    const users = new Set<string>();
    // memberStatsからユーザーを追加
    analyticsData.memberStats.forEach((member) => {
      users.add(member.user);
      // commentInteractionsからもユーザーを追加（ボットなど）
      member.commentInteractions.forEach((interaction) => {
        users.add(interaction.user);
      });
    });

    return Array.from(users);
  };

  // 除外ユーザーを適用してデータをフィルタリングする関数
  const filterData = (analyticsData: AnalyticsData): AnalyticsData => {
    return {
      ...analyticsData,
      memberStats: analyticsData.memberStats
        .filter((member) => !excludedUsers.includes(member.user))
        .map((member) => ({
          ...member,
          commentInteractions: member.commentInteractions.filter(
            (interaction) => !excludedUsers.includes(interaction.user)
          ),
        })),
    };
  };

  // 全体のコメントインタラクションを集計する関数
  const aggregateCommentInteractions = (
    analyticsData: AnalyticsData
  ): CommentInteraction[] => {
    const filteredData = filterData(analyticsData);
    const interactions: CommentInteraction[] = [];

    filteredData.memberStats.forEach((member) => {
      member.commentInteractions.forEach((interaction) => {
        interactions.push({
          from: interaction.user,
          fromAvatar: interaction.avatar_url,
          to: member.user,
          toAvatar: member.avatar_url,
          count: interaction.count,
        });
      });
    });

    // コメント数でソートして上位10件を返す
    return interactions.sort((a, b) => b.count - a.count).slice(0, 10);
  };

  // 除外ユーザー設定の切り替え
  const toggleUserExclusion = (user: string) => {
    setExcludedUsers((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user]
    );
  };

  return {
    excludedUsers,
    setExcludedUsers,
    showUserExcludeSettings,
    setShowUserExcludeSettings,
    getAllUsersFromData,
    filterData,
    aggregateCommentInteractions,
    toggleUserExclusion,
  };
};
