import { promises as fs } from "fs";
import path from "path";
import { formatISO, getISOWeek, getYear } from "date-fns";

export interface WeeklyPRData {
  week: string;
  repository: {
    owner: string;
    name: string;
  };
  prs: Array<{
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
  }>;
  collected_at: string;
}

export class DataStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "data", "weekly");
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private getWeekString(date: Date): string {
    const year = getYear(date);
    const week = getISOWeek(date);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  private getFilePath(owner: string, repo: string, week: string): string {
    return path.join(this.baseDir, owner, repo, `${week}.json`);
  }

  async saveWeeklyData(
    owner: string,
    repo: string,
    weeklyData: WeeklyPRData
  ): Promise<void> {
    const filePath = this.getFilePath(owner, repo, weeklyData.week);
    const dirPath = path.dirname(filePath);

    await this.ensureDirectoryExists(dirPath);

    const dataToSave = {
      ...weeklyData,
      collected_at: formatISO(new Date()),
    };

    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    console.log(`Saved weekly data: ${filePath}`);
  }

  async getWeeklyData(
    owner: string,
    repo: string,
    week: string
  ): Promise<WeeklyPRData | null> {
    try {
      const filePath = this.getFilePath(owner, repo, week);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.log(`No data found for ${owner}/${repo} week ${week}, ${error}`);
      return null;
    }
  }

  async getAllWeeksData(owner: string, repo: string): Promise<WeeklyPRData[]> {
    try {
      const repoDir = path.join(this.baseDir, owner, repo);
      await this.ensureDirectoryExists(repoDir);

      const files = await fs.readdir(repoDir);
      const weeklyDataList: WeeklyPRData[] = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const week = file.replace(".json", "");
          const data = await this.getWeeklyData(owner, repo, week);
          if (data) {
            weeklyDataList.push(data);
          }
        }
      }

      // 週順でソート
      return weeklyDataList.sort((a, b) => a.week.localeCompare(b.week));
    } catch {
      console.error(`Error reading data for ${owner}/${repo}`);
      return [];
    }
  }

  async getAvailableWeeks(owner: string, repo: string): Promise<string[]> {
    try {
      const repoDir = path.join(this.baseDir, owner, repo);
      const files = await fs.readdir(repoDir);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }

  async getLastCollectedWeek(
    owner: string,
    repo: string
  ): Promise<string | null> {
    const weeks = await this.getAvailableWeeks(owner, repo);
    return weeks.length > 0 ? weeks[weeks.length - 1] : null;
  }

  // 現在の週を取得
  getCurrentWeek(): string {
    return this.getWeekString(new Date());
  }

  // 過去N週間のリストを取得
  getRecentWeeks(weeksCount: number = 52): string[] {
    const weeks: string[] = [];
    const now = new Date();

    for (let i = weeksCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      weeks.push(this.getWeekString(date));
    }

    return weeks;
  }

  // 指定された期間のデータを取得
  async getDataByDateRange(
    owner: string,
    repo: string,
    fromDate: string,
    toDate: string
  ): Promise<WeeklyPRData[]> {
    try {
      const allData = await this.getAllWeeksData(owner, repo);

      // 日付を週に変換
      const fromWeek = this.getWeekString(new Date(fromDate));
      const toWeek = this.getWeekString(new Date(toDate));

      // 期間内のデータをフィルタリング
      return allData.filter((data) => {
        return data.week >= fromWeek && data.week <= toWeek;
      });
    } catch {
      console.error(
        `Error filtering data for ${owner}/${repo} from ${fromDate} to ${toDate}`
      );
      return [];
    }
  }

  // 利用可能なリポジトリ一覧を取得
  async getAvailableRepositories(): Promise<
    Array<{ owner: string; repo: string }>
  > {
    try {
      // まず設定ファイルからリポジトリを取得
      const configRepositories = await this.getConfiguredRepositories();

      // データディレクトリからも取得（既存のロジック）
      await this.ensureDirectoryExists(this.baseDir);
      const ownerDirs = await fs.readdir(this.baseDir);
      const dataRepositories: Array<{ owner: string; repo: string }> = [];

      for (const owner of ownerDirs) {
        const ownerPath = path.join(this.baseDir, owner);
        const stat = await fs.stat(ownerPath);

        if (stat.isDirectory()) {
          const repoDirs = await fs.readdir(ownerPath);

          for (const repo of repoDirs) {
            const repoPath = path.join(ownerPath, repo);
            const repoStat = await fs.stat(repoPath);

            if (repoStat.isDirectory()) {
              // データファイルが存在するかチェック
              const files = await fs.readdir(repoPath);
              const hasData = files.some((file) => file.endsWith(".json"));

              if (hasData) {
                dataRepositories.push({ owner, repo });
              }
            }
          }
        }
      }

      // 設定ファイルとデータディレクトリからのリポジトリをマージ（重複排除）
      const allRepositories = [...configRepositories];

      for (const dataRepo of dataRepositories) {
        const exists = allRepositories.some(
          (repo) => repo.owner === dataRepo.owner && repo.repo === dataRepo.repo
        );
        if (!exists) {
          allRepositories.push(dataRepo);
        }
      }

      return allRepositories.sort((a, b) =>
        `${a.owner}/${a.repo}`.localeCompare(`${b.owner}/${b.repo}`)
      );
    } catch {
      return [];
    }
  }

  // 設定ファイルからリポジトリ一覧を取得
  private async getConfiguredRepositories(): Promise<
    Array<{ owner: string; repo: string }>
  > {
    try {
      const configPath = path.join(
        process.cwd(),
        "config",
        "repositories.json"
      );
      const configData = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(configData);

      return config.default || [];
    } catch {
      return [];
    }
  }
}
