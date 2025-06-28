import { WeeklyPRData } from "@/lib/dataStorage";
import {
  MemberStats,
  WeeklyTrend,
  OverallTrend,
  LabelStats,
  AnalyticsResult,
} from "./types";
import { calculateMergeTime } from "./utils";

/**
 * 週次データを処理してanalytics統計を計算します
 * @param weeklyDataList 週次PRデータのリスト
 * @returns 計算されたanalytics統計
 */
export function processWeeklyData(
  weeklyDataList: WeeklyPRData[]
): AnalyticsResult {
  const memberMap = new Map<string, MemberStats>();
  const weeklyTrendsMap = new Map<string, WeeklyTrend>();
  const labelStats: LabelStats = {};

  // 全データを統合
  const allPRs = weeklyDataList.flatMap((weekData) => weekData.prs);

  // 週次トレンド計算
  for (const weekData of weeklyDataList) {
    const week = weekData.week;
    const weekPRs = weekData.prs;

    const mergedPRs = weekPRs.filter((pr) => pr.merged_at);
    const totalChanges = weekPRs.reduce(
      (sum, pr) => sum + pr.additions + pr.deletions,
      0
    );
    const avgChanges = weekPRs.length > 0 ? totalChanges / weekPRs.length : 0;

    const mergeTime = mergedPRs.reduce(
      (sum, pr) => sum + calculateMergeTime(pr.created_at, pr.merged_at),
      0
    );
    const avgMergeTime =
      mergedPRs.length > 0 ? mergeTime / mergedPRs.length : 0;

    weeklyTrendsMap.set(week, {
      week,
      totalPRs: weekPRs.length,
      avgChanges,
      avgMergeTime,
      mergedPRs: mergedPRs.length,
    });
  }

  // メンバー統計計算
  for (const pr of allPRs) {
    const userLogin = pr.user.login;

    if (!memberMap.has(userLogin)) {
      memberMap.set(userLogin, {
        user: userLogin,
        avatar_url: pr.user.avatar_url,
        totalPRs: 0,
        mergedPRs: 0,
        openPRs: 0,
        avgChanges: 0,
        avgMergeTime: 0,
        totalComments: 0,
        totalReviewComments: 0,
        avgCommits: 0,
        labels: [],
        commentInteractions: [],
        weeklyTrends: [],
      });
    }

    const member = memberMap.get(userLogin)!;
    member.totalPRs++;

    if (pr.merged_at) {
      member.mergedPRs++;
    } else if (pr.state === "open") {
      member.openPRs++;
    }

    member.totalComments += pr.comments;
    member.totalReviewComments += pr.review_comments;

    // ラベル統計
    for (const label of pr.labels) {
      if (!labelStats[label.name]) {
        labelStats[label.name] = { count: 0, color: label.color };
      }
      labelStats[label.name].count++;

      if (!member.labels.includes(label.name)) {
        member.labels.push(label.name);
      }
    }
  }

  // メンバー統計の平均値計算
  for (const member of memberMap.values()) {
    const memberPRs = allPRs.filter((pr) => pr.user.login === member.user);

    const totalChanges = memberPRs.reduce(
      (sum, pr) => sum + pr.additions + pr.deletions,
      0
    );
    member.avgChanges =
      memberPRs.length > 0 ? totalChanges / memberPRs.length : 0;

    const mergedPRs = memberPRs.filter((pr) => pr.merged_at);
    const totalMergeTime = mergedPRs.reduce(
      (sum, pr) => sum + calculateMergeTime(pr.created_at, pr.merged_at),
      0
    );
    member.avgMergeTime =
      mergedPRs.length > 0 ? totalMergeTime / mergedPRs.length : 0;

    const totalCommits = memberPRs.reduce((sum, pr) => sum + pr.commits, 0);
    member.avgCommits =
      memberPRs.length > 0 ? totalCommits / memberPRs.length : 0;

    // コメントインタラクション（Issue Comments + Review Comments）
    const interactionMap = new Map<
      string,
      { count: number; avatar_url: string }
    >();
    for (const pr of memberPRs) {
      // Issue Comments
      for (const comment of pr.comment_list) {
        const commenterLogin = comment.user.login;
        if (commenterLogin !== member.user) {
          if (!interactionMap.has(commenterLogin)) {
            interactionMap.set(commenterLogin, {
              count: 0,
              avatar_url: comment.user.avatar_url,
            });
          }
          interactionMap.get(commenterLogin)!.count++;
        }
      }

      // Review Comments
      if (pr.review_comment_list) {
        for (const comment of pr.review_comment_list) {
          const commenterLogin = comment.user.login;
          if (commenterLogin !== member.user) {
            if (!interactionMap.has(commenterLogin)) {
              interactionMap.set(commenterLogin, {
                count: 0,
                avatar_url: comment.user.avatar_url,
              });
            }
            interactionMap.get(commenterLogin)!.count++;
          }
        }
      }
    }

    member.commentInteractions = Array.from(interactionMap.entries())
      .map(([user, data]) => ({
        user,
        avatar_url: data.avatar_url,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 週次トレンド
    for (const weekData of weeklyDataList) {
      const weekPRs = weekData.prs.filter(
        (pr) => pr.user.login === member.user
      );
      const totalChanges = weekPRs.reduce(
        (sum, pr) => sum + pr.additions + pr.deletions,
        0
      );
      const avgChanges = weekPRs.length > 0 ? totalChanges / weekPRs.length : 0;

      const mergedPRs = weekPRs.filter((pr) => pr.merged_at);
      const mergeTime = mergedPRs.reduce(
        (sum, pr) => sum + calculateMergeTime(pr.created_at, pr.merged_at),
        0
      );
      const avgMergeTime =
        mergedPRs.length > 0 ? mergeTime / mergedPRs.length : 0;

      member.weeklyTrends.push({
        week: weekData.week,
        prs: weekPRs.length,
        changes: avgChanges,
        mergeTime: avgMergeTime,
      });
    }
  }

  // 全体統計計算
  const totalMerged = allPRs.filter((pr) => pr.merged_at).length;
  const totalOpen = allPRs.filter((pr) => pr.state === "open").length;
  const totalChanges = allPRs.reduce(
    (sum, pr) => sum + pr.additions + pr.deletions,
    0
  );
  const avgChanges = allPRs.length > 0 ? totalChanges / allPRs.length : 0;

  const mergedPRs = allPRs.filter((pr) => pr.merged_at);
  const totalMergeTime = mergedPRs.reduce(
    (sum, pr) => sum + calculateMergeTime(pr.created_at, pr.merged_at),
    0
  );
  const avgMergeTime =
    mergedPRs.length > 0 ? totalMergeTime / mergedPRs.length : 0;

  const totalComments = allPRs.reduce((sum, pr) => sum + pr.comments, 0);
  const totalReviewComments = allPRs.reduce(
    (sum, pr) => sum + pr.review_comments,
    0
  );
  const totalCommits = allPRs.reduce((sum, pr) => sum + pr.commits, 0);
  const avgCommits = allPRs.length > 0 ? totalCommits / allPRs.length : 0;

  const overallTrend: OverallTrend = {
    totalPRs: allPRs.length,
    mergedPRs: totalMerged,
    openPRs: totalOpen,
    avgChanges,
    avgMergeTime,
    totalComments,
    totalReviewComments,
    avgCommits,
    activeDevelopers: memberMap.size,
    avgPRsPerWeek:
      weeklyDataList.length > 0 ? allPRs.length / weeklyDataList.length : 0,
    avgChangesPerWeek:
      weeklyDataList.length > 0 ? totalChanges / weeklyDataList.length : 0,
    mergeRatio: allPRs.length > 0 ? (totalMerged / allPRs.length) * 100 : 0,
  };

  return {
    memberStats: Array.from(memberMap.values()),
    weeklyTrends: Array.from(weeklyTrendsMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    ),
    overallTrend,
    labelStats,
  };
}
