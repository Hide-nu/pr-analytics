import { WeeklyPRData } from "@/lib/dataStorage";

export interface CollectDataRequest {
  owner: string;
  repo: string;
  week?: string;
}

export interface CollectDataResponse {
  message: string;
  week: string;
  prCount: number;
  data: WeeklyPRData;
}

export interface AvailableWeeksResponse {
  owner: string;
  repo: string;
  currentWeek: string;
  lastCollectedWeek: string | null;
  availableWeeks: string[];
  recentWeeks: string[];
  totalWeeks: number;
}

export interface PRDetail {
  id: number;
  number: number;
  state: "open" | "closed";
  created_at: string;
  merged_at: string | null;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  commits: number;
  reviews: Array<unknown>;
  comment_list: Array<{
    user: {
      login: string;
      avatar_url: string;
    };
  }>;
  review_comment_list: Array<{
    user: {
      login: string;
      avatar_url: string;
    };
  }>;
}

export interface DataCollectionResult {
  prDetails: PRDetail[];
  totalFound: number;
  processedCount: number;
}
