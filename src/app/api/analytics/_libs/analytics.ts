import { WeeklyPRData } from "@/lib/dataStorage";
import {
  MemberStats,
  WeeklyTrend,
  OverallTrend,
  LabelStats,
  LabelTimelineData,
  CycleTimeBreakdownData,
  CodeChurnData,
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

  // ラベル時系列データ計算
  const labelTimeline: LabelTimelineData[] = weeklyDataList
    .map((weekData) => {
      const weekPRs = weekData.prs;
      const totalPRs = weekPRs.length;

      // 各ラベルのカウントを初期化
      const labelCounts = {
        bug: 0,
        "tech-debt": 0,
        refactoring: 0,
        feature: 0,
        documentation: 0,
        test: 0,
        chore: 0,
        other: 0,
      };

      // 各PRのラベルを集計
      for (const pr of weekPRs) {
        const prLabels = pr.labels.map((label) => label.name.toLowerCase());

        // ラベルの分類（優先度順で判定）
        if (
          prLabels.some(
            (label) => label.includes("bug") || label.includes("fix")
          )
        ) {
          labelCounts.bug++;
        } else if (
          prLabels.some(
            (label) => label.includes("debt") || label.includes("technical")
          )
        ) {
          labelCounts["tech-debt"]++;
        } else if (
          prLabels.some(
            (label) =>
              label.includes("refactor") || label.includes("refactoring")
          )
        ) {
          labelCounts.refactoring++;
        } else if (
          prLabels.some(
            (label) => label.includes("feature") || label.includes("feat")
          )
        ) {
          labelCounts.feature++;
        } else if (
          prLabels.some(
            (label) => label.includes("doc") || label.includes("documentation")
          )
        ) {
          labelCounts.documentation++;
        } else if (
          prLabels.some(
            (label) => label.includes("test") || label.includes("testing")
          )
        ) {
          labelCounts.test++;
        } else if (
          prLabels.some(
            (label) => label.includes("chore") || label.includes("misc")
          )
        ) {
          labelCounts.chore++;
        } else {
          labelCounts.other++;
        }
      }

      // パーセンテージを計算
      const bugPercentage =
        totalPRs > 0 ? (labelCounts.bug / totalPRs) * 100 : 0;
      const techDebtPercentage =
        totalPRs > 0 ? (labelCounts["tech-debt"] / totalPRs) * 100 : 0;
      const refactoringPercentage =
        totalPRs > 0 ? (labelCounts.refactoring / totalPRs) * 100 : 0;
      const featurePercentage =
        totalPRs > 0 ? (labelCounts.feature / totalPRs) * 100 : 0;
      const documentationPercentage =
        totalPRs > 0 ? (labelCounts.documentation / totalPRs) * 100 : 0;
      const testPercentage =
        totalPRs > 0 ? (labelCounts.test / totalPRs) * 100 : 0;
      const chorePercentage =
        totalPRs > 0 ? (labelCounts.chore / totalPRs) * 100 : 0;
      const otherPercentage =
        totalPRs > 0 ? (labelCounts.other / totalPRs) * 100 : 0;

      return {
        week: weekData.week,
        totalPRs,
        ...labelCounts,
        bugPercentage,
        techDebtPercentage,
        refactoringPercentage,
        featurePercentage,
        documentationPercentage,
        testPercentage,
        chorePercentage,
        otherPercentage,
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week));

  // サイクルタイム分解データ計算
  const cycleTimeBreakdown: CycleTimeBreakdownData[] = weeklyDataList
    .map((weekData) => {
      const weekPRs = weekData.prs.filter((pr) => pr.merged_at); // マージされたPRのみ

      if (weekPRs.length === 0) {
        return {
          week: weekData.week,
          avgTimeToFirstReview: 0,
          avgReviewTime: 0,
          avgTimeToMerge: 0,
          avgTotalCycleTime: 0,
          totalPRs: 0,
          bottleneckType: "balanced" as const,
          medianCycleTime: 0,
          p95CycleTime: 0,
        };
      }

      const cycleTimes = weekPRs.map((pr) => {
        const createdAt = new Date(pr.created_at).getTime();
        const mergedAt = new Date(pr.merged_at!).getTime();
        const totalCycleTime = (mergedAt - createdAt) / (1000 * 60 * 60); // 時間単位

        // 最初のレビューまでの時間を計算
        const reviews = pr.reviews as Array<{ submitted_at: string }>;
        const firstReview =
          reviews.length > 0
            ? Math.min(
                ...reviews.map((r) => new Date(r.submitted_at).getTime())
              )
            : mergedAt;
        const timeToFirstReview = (firstReview - createdAt) / (1000 * 60 * 60);

        // レビュー時間（最初のレビューから最後のレビューまで）
        const lastReview =
          reviews.length > 0
            ? Math.max(
                ...reviews.map((r) => new Date(r.submitted_at).getTime())
              )
            : firstReview;
        const reviewTime =
          reviews.length > 1
            ? (lastReview - firstReview) / (1000 * 60 * 60)
            : 0;

        // マージ待ち時間（最後のレビューからマージまで）
        const timeToMerge =
          (mergedAt - Math.max(lastReview, firstReview)) / (1000 * 60 * 60);

        return {
          total: totalCycleTime,
          toFirstReview: Math.max(0, timeToFirstReview),
          review: Math.max(0, reviewTime),
          toMerge: Math.max(0, timeToMerge),
        };
      });

      const avgTimeToFirstReview =
        cycleTimes.reduce((sum, ct) => sum + ct.toFirstReview, 0) /
        cycleTimes.length;
      const avgReviewTime =
        cycleTimes.reduce((sum, ct) => sum + ct.review, 0) / cycleTimes.length;
      const avgTimeToMerge =
        cycleTimes.reduce((sum, ct) => sum + ct.toMerge, 0) / cycleTimes.length;
      const avgTotalCycleTime =
        cycleTimes.reduce((sum, ct) => sum + ct.total, 0) / cycleTimes.length;

      // ボトルネックタイプを判定
      let bottleneckType: CycleTimeBreakdownData["bottleneckType"] = "balanced";
      const max = Math.max(avgTimeToFirstReview, avgReviewTime, avgTimeToMerge);
      if (
        max === avgTimeToFirstReview &&
        avgTimeToFirstReview > avgTotalCycleTime * 0.4
      ) {
        bottleneckType = "review-wait";
      } else if (
        max === avgReviewTime &&
        avgReviewTime > avgTotalCycleTime * 0.4
      ) {
        bottleneckType = "review-process";
      } else if (
        max === avgTimeToMerge &&
        avgTimeToMerge > avgTotalCycleTime * 0.4
      ) {
        bottleneckType = "merge-wait";
      }

      // 中央値とパーセンタイル計算
      const sortedTotalTimes = cycleTimes
        .map((ct) => ct.total)
        .sort((a, b) => a - b);
      const medianCycleTime =
        sortedTotalTimes[Math.floor(sortedTotalTimes.length / 2)] || 0;
      const p95CycleTime =
        sortedTotalTimes[Math.floor(sortedTotalTimes.length * 0.95)] || 0;

      return {
        week: weekData.week,
        avgTimeToFirstReview,
        avgReviewTime,
        avgTimeToMerge,
        avgTotalCycleTime,
        totalPRs: weekPRs.length,
        bottleneckType,
        medianCycleTime,
        p95CycleTime,
      };
    })
    .filter((data) => data.totalPRs > 0)
    .sort((a, b) => a.week.localeCompare(b.week));

  // 手戻り率（Code Churn）データ計算
  const codeChurn: CodeChurnData[] = weeklyDataList
    .map((weekData) => {
      const weekPRs = weekData.prs.filter((pr) => pr.merged_at); // マージされたPRのみ

      if (weekPRs.length === 0) {
        return {
          week: weekData.week,
          avgChurnRate: 0,
          avgCommitsPerPR: 0,
          avgChangesPerCommit: 0,
          avgReviewRounds: 0,
          totalPRs: 0,
          highChurnPRs: 0,
          highChurnRate: 0,
          medianChurnRate: 0,
          p95ChurnRate: 0,
          avgTotalChanges: 0,
          churnTrend: "stable" as const,
        };
      }

      const prAnalytics = weekPRs.map((pr) => {
        const commits = pr.commits || 1;
        const totalChanges = (pr.additions || 0) + (pr.deletions || 0);
        const reviewCount =
          (pr.reviews as Array<{ submitted_at: string }>)?.length || 0;

        // 手戻り率の計算
        // 基本的な考え方：理想的には1コミットで完了するが、レビューフィードバックで追加コミットが発生
        const baseChurnRate = commits > 1 ? ((commits - 1) / commits) * 100 : 0;

        // レビュー数による調整（レビューが多いほど手戻りが多い傾向）
        const reviewAdjustment = Math.min(reviewCount * 8, 25); // 最大25%の追加

        // コミット当たり変更行数による調整（極端に小さい変更行数は手戻りを示唆）
        const changesPerCommit = totalChanges / commits;
        let changeAdjustment = 0;
        if (changesPerCommit < 5) {
          changeAdjustment = 15; // 細かい修正が多い場合
        } else if (changesPerCommit > 300) {
          changeAdjustment = 10; // 大きすぎる変更も計画性の欠如を示唆
        }

        // レビューコメント数による調整
        const reviewComments = pr.review_comments || 0;
        const commentAdjustment = Math.min(reviewComments * 2, 15); // 最大15%の追加

        const churnRate = Math.min(
          Math.max(
            baseChurnRate +
              reviewAdjustment +
              changeAdjustment +
              commentAdjustment,
            0
          ),
          95
        );

        return {
          churnRate,
          commits,
          totalChanges,
          reviewCount,
          changesPerCommit,
          reviewComments,
        };
      });

      // 週次統計を計算
      const avgChurnRate =
        prAnalytics.reduce((sum, p) => sum + p.churnRate, 0) /
        prAnalytics.length;
      const avgCommitsPerPR =
        prAnalytics.reduce((sum, p) => sum + p.commits, 0) / prAnalytics.length;
      const avgChangesPerCommit =
        prAnalytics.reduce((sum, p) => sum + p.changesPerCommit, 0) /
        prAnalytics.length;
      const avgReviewRounds =
        prAnalytics.reduce((sum, p) => sum + p.reviewCount, 0) /
        prAnalytics.length;
      const avgTotalChanges =
        prAnalytics.reduce((sum, p) => sum + p.totalChanges, 0) /
        prAnalytics.length;

      const highChurnPRs = prAnalytics.filter((p) => p.churnRate > 50).length;
      const highChurnRate = (highChurnPRs / prAnalytics.length) * 100;

      // 中央値とパーセンタイル計算
      const sortedChurnRates = prAnalytics
        .map((p) => p.churnRate)
        .sort((a, b) => a - b);
      const medianChurnRate =
        sortedChurnRates[Math.floor(sortedChurnRates.length / 2)] || 0;
      const p95ChurnRate =
        sortedChurnRates[Math.floor(sortedChurnRates.length * 0.95)] || 0;

      return {
        week: weekData.week,
        avgChurnRate,
        avgCommitsPerPR,
        avgChangesPerCommit,
        avgReviewRounds,
        totalPRs: weekPRs.length,
        highChurnPRs,
        highChurnRate,
        medianChurnRate,
        p95ChurnRate,
        avgTotalChanges,
        churnTrend: "stable" as const, // 後で前週比較で実装
      };
    })
    .filter((data) => data.totalPRs > 0)
    .sort((a, b) => a.week.localeCompare(b.week));

  // トレンド分析（前週との比較）
  for (let i = 1; i < codeChurn.length; i++) {
    const current = codeChurn[i];
    const previous = codeChurn[i - 1];

    const churnDiff = current.avgChurnRate - previous.avgChurnRate;
    if (churnDiff < -5) {
      current.churnTrend = "improving"; // 手戻り率が5%以上改善
    } else if (churnDiff > 5) {
      current.churnTrend = "degrading"; // 手戻り率が5%以上悪化
    } else {
      current.churnTrend = "stable"; // 変化が軽微
    }
  }

  return {
    memberStats: Array.from(memberMap.values()),
    weeklyTrends: Array.from(weeklyTrendsMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    ),
    overallTrend,
    labelStats,
    labelTimeline,
    cycleTimeBreakdown,
    codeChurn,
  };
}
