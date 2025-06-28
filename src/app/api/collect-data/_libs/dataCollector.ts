import { parseISO } from "date-fns";
import { WeeklyPRData, DataStorage } from "@/lib/dataStorage";
import { PRDetail, DataCollectionResult } from "./types";
import {
  getWeekStartFromISOWeek,
  getWeekEndFromISOWeek,
  buildGitHubSearchQuery,
} from "./utils";

// GitHub API レスポンス型定義
interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface GitHubLabel {
  name: string;
  color: string;
}

interface GitHubPR {
  id: number;
  number: number;
  state: string;
  created_at: string;
  merged_at: string | null;
  title: string;
  user: GitHubUser | null;
  labels: GitHubLabel[];
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  commits: number;
}

interface GitHubComment {
  user: GitHubUser | null;
}

interface GitHubSearchItem {
  number: number;
  pull_request?: object;
}

interface GitHubSearchResponse {
  data: {
    total_count: number;
    items: GitHubSearchItem[];
  };
}

interface GitHubPRResponse {
  data: GitHubPR;
}

interface GitHubCommentsResponse {
  data: GitHubComment[];
}

export interface GitHubClient {
  search: {
    issuesAndPullRequests: (params: {
      q: string;
      sort?:
        | "created"
        | "comments"
        | "reactions"
        | "reactions-+1"
        | "reactions--1"
        | "reactions-smile"
        | "reactions-thinking_face"
        | "reactions-heart"
        | "reactions-tada"
        | "interactions"
        | "updated";
      order?: "desc" | "asc";
      per_page?: number;
      page?: number;
    }) => Promise<GitHubSearchResponse>;
  };
  pulls: {
    get: (params: {
      owner: string;
      repo: string;
      pull_number: number;
    }) => Promise<GitHubPRResponse>;
    listReviews: (params: {
      owner: string;
      repo: string;
      pull_number: number;
    }) => Promise<GitHubCommentsResponse>;
    listReviewComments: (params: {
      owner: string;
      repo: string;
      pull_number: number;
    }) => Promise<GitHubCommentsResponse>;
  };
  issues: {
    listComments: (params: {
      owner: string;
      repo: string;
      issue_number: number;
    }) => Promise<GitHubCommentsResponse>;
  };
}

/**
 * 指定週のPR一覧をGitHub APIから検索します
 */
export async function searchPRsForWeek(
  client: GitHubClient,
  owner: string,
  repo: string,
  week: string
): Promise<number[]> {
  const weekStart = getWeekStartFromISOWeek(week);
  const weekEnd = getWeekEndFromISOWeek(week);
  const searchQuery = buildGitHubSearchQuery(owner, repo, weekStart, weekEnd);

  console.log(`Search query: ${searchQuery}`);

  const searchResponse = await client.search.issuesAndPullRequests({
    q: searchQuery,
    sort: "created",
    order: "desc",
    per_page: 100,
  });

  console.log(
    `Found ${searchResponse.data.total_count} PRs from search for week ${week}`
  );

  return searchResponse.data.items
    .filter((item) => item.pull_request)
    .map((item) => item.number);
}

/**
 * 単一PRの詳細情報を取得します
 */
export async function fetchPRDetail(
  client: GitHubClient,
  owner: string,
  repo: string,
  prNumber: number,
  weekStart: Date,
  weekEnd: Date
): Promise<PRDetail | null> {
  try {
    const [prResp, reviewsResp, commentsResp, reviewCommentsResp] =
      await Promise.all([
        client.pulls.get({ owner, repo, pull_number: prNumber }),
        client.pulls.listReviews({ owner, repo, pull_number: prNumber }),
        client.issues.listComments({
          owner,
          repo,
          issue_number: prNumber,
        }),
        client.pulls.listReviewComments({
          owner,
          repo,
          pull_number: prNumber,
        }),
      ]);

    const pr = prResp.data;

    // 作成日が週の範囲内にあることを再確認
    const createdDate = parseISO(pr.created_at);
    if (createdDate < weekStart || createdDate > weekEnd) {
      console.log(`PR #${prNumber} created outside week range, skipping`);
      return null;
    }

    return {
      id: pr.id,
      number: pr.number,
      state: pr.state as "open" | "closed",
      created_at: pr.created_at,
      merged_at: pr.merged_at,
      title: pr.title,
      user: {
        login: pr.user?.login || "",
        avatar_url: pr.user?.avatar_url || "",
      },
      labels:
        pr.labels?.map((label: GitHubLabel | string) => ({
          name: typeof label === "string" ? label : label.name || "",
          color: typeof label === "string" ? "" : label.color || "",
        })) || [],
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      changed_files: pr.changed_files || 0,
      comments: pr.comments || 0,
      review_comments: pr.review_comments || 0,
      commits: pr.commits || 0,
      reviews: reviewsResp.data,
      comment_list: commentsResp.data.map((comment: GitHubComment) => ({
        user: {
          login: comment.user?.login || "",
          avatar_url: comment.user?.avatar_url || "",
        },
      })),
      review_comment_list: reviewCommentsResp.data.map(
        (comment: GitHubComment) => ({
          user: {
            login: comment.user?.login || "",
            avatar_url: comment.user?.avatar_url || "",
          },
        })
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for PR #${prNumber}:`, error);
    return null;
  }
}

/**
 * 週次データを収集してWeeklyPRDataオブジェクトを作成します
 */
export async function collectWeeklyData(
  client: GitHubClient,
  owner: string,
  repo: string,
  week: string
): Promise<DataCollectionResult> {
  const weekStart = getWeekStartFromISOWeek(week);
  const weekEnd = getWeekEndFromISOWeek(week);

  console.log(
    `Collecting PRs from ${weekStart.toISOString()} to ${weekEnd.toISOString()}`
  );

  // PRを検索
  const prNumbers = await searchPRsForWeek(client, owner, repo, week);
  console.log(`Processing ${prNumbers.length} PRs`);

  // 各PRの詳細情報を取得
  const prDetails = await Promise.allSettled(
    prNumbers.map((prNumber: number) =>
      fetchPRDetail(client, owner, repo, prNumber, weekStart, weekEnd)
    )
  );

  const validPrDetails = prDetails
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((pr): pr is NonNullable<typeof pr> => pr !== null);

  console.log(
    `Successfully processed ${validPrDetails.length} PRs for week ${week}`
  );

  return {
    prDetails: validPrDetails,
    totalFound: prNumbers.length,
    processedCount: validPrDetails.length,
  };
}

/**
 * 既存データがあるかチェックします
 */
export async function checkExistingData(
  dataStorage: DataStorage,
  owner: string,
  repo: string,
  week: string
): Promise<WeeklyPRData | null> {
  return await dataStorage.getWeeklyData(owner, repo, week);
}

/**
 * 週次データを保存します
 */
export async function saveWeeklyData(
  dataStorage: DataStorage,
  owner: string,
  repo: string,
  week: string,
  prDetails: PRDetail[]
): Promise<WeeklyPRData> {
  const weeklyData: WeeklyPRData = {
    week,
    repository: { owner, name: repo },
    prs: prDetails,
    collected_at: new Date().toISOString(),
  };

  await dataStorage.saveWeeklyData(owner, repo, weeklyData);
  return weeklyData;
}
