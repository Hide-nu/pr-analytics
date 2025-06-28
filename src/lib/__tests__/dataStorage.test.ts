import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { DataStorage, WeeklyPRData } from "../dataStorage";

// fsモジュールをモック化
vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

// pathモジュールをモック化
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join("/")),
  };
});

describe("DataStorage", () => {
  let dataStorage: DataStorage;
  const mockWeeklyData: WeeklyPRData = {
    week: "2024-W01",
    repository: {
      owner: "testowner",
      name: "testrepo",
    },
    prs: [
      {
        id: 1,
        number: 1,
        state: "open",
        created_at: "2024-01-01T00:00:00Z",
        merged_at: null,
        title: "Test PR",
        user: {
          login: "testuser",
          avatar_url: "https://example.com/avatar.jpg",
        },
        labels: [
          {
            name: "bug",
            color: "ff0000",
          },
        ],
        additions: 10,
        deletions: 5,
        changed_files: 2,
        comments: 3,
        review_comments: 1,
        commits: 2,
        reviews: [],
        comment_list: [],
        review_comment_list: [],
      },
    ],
    collected_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    // process.cwdをモック化
    vi.spyOn(process, "cwd").mockReturnValue("/mock/cwd");
    dataStorage = new DataStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("baseDirが正しく設定される", () => {
      expect(dataStorage).toBeInstanceOf(DataStorage);
    });
  });

  describe("getCurrentWeek", () => {
    it("現在の週を正しいフォーマットで返す", () => {
      const currentWeek = dataStorage.getCurrentWeek();
      expect(currentWeek).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe("getRecentWeeks", () => {
    it("デフォルトで52週間のリストを返す", () => {
      const weeks = dataStorage.getRecentWeeks();
      expect(weeks).toHaveLength(52);
      expect(weeks[0]).toMatch(/^\d{4}-W\d{2}$/);
    });

    it("指定した週数のリストを返す", () => {
      const weeks = dataStorage.getRecentWeeks(10);
      expect(weeks).toHaveLength(10);
    });
  });

  describe("saveWeeklyData", () => {
    it("ディレクトリが存在しない場合、作成してからデータを保存する", async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockAccess.mockRejectedValue(new Error("Directory not found"));
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await dataStorage.saveWeeklyData("testowner", "testrepo", mockWeeklyData);

      expect(mockMkdir).toHaveBeenCalledWith(
        path.join("/mock/cwd", "data", "weekly", "testowner", "testrepo"),
        { recursive: true }
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(
          "/mock/cwd",
          "data",
          "weekly",
          "testowner",
          "testrepo",
          "2024-W01.json"
        ),
        expect.stringContaining('"week": "2024-W01"'),
        "utf-8"
      );
    });

    it("ディレクトリが存在する場合、直接データを保存する", async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await dataStorage.saveWeeklyData("testowner", "testrepo", mockWeeklyData);

      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("getWeeklyData", () => {
    it("存在するデータを正しく読み取る", async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue(JSON.stringify(mockWeeklyData));

      const result = await dataStorage.getWeeklyData(
        "testowner",
        "testrepo",
        "2024-W01"
      );

      expect(result).toEqual(mockWeeklyData);
      expect(mockReadFile).toHaveBeenCalledWith(
        path.join(
          "/mock/cwd",
          "data",
          "weekly",
          "testowner",
          "testrepo",
          "2024-W01.json"
        ),
        "utf-8"
      );
    });

    it("ファイルが存在しない場合、nullを返す", async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const result = await dataStorage.getWeeklyData(
        "testowner",
        "testrepo",
        "2024-W01"
      );

      expect(result).toBeNull();
    });

    it("JSONパースエラーの場合、nullを返す", async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue("invalid json");

      const result = await dataStorage.getWeeklyData(
        "testowner",
        "testrepo",
        "2024-W01"
      );

      expect(result).toBeNull();
    });
  });

  describe("getAvailableWeeks", () => {
    it("利用可能な週のリストを返す", async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue([
        "2024-W01.json",
        "2024-W02.json",
        "other.txt",
      ] as never);

      const result = await dataStorage.getAvailableWeeks(
        "testowner",
        "testrepo"
      );

      expect(result).toEqual(["2024-W01", "2024-W02"]);
    });

    it("ディレクトリが存在しない場合、空配列を返す", async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockRejectedValue(new Error("Directory not found"));

      const result = await dataStorage.getAvailableWeeks(
        "testowner",
        "testrepo"
      );

      expect(result).toEqual([]);
    });
  });

  describe("getLastCollectedWeek", () => {
    it("最後に収集された週を返す", async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue([
        "2024-W01.json",
        "2024-W03.json",
        "2024-W02.json",
      ] as never);

      const result = await dataStorage.getLastCollectedWeek(
        "testowner",
        "testrepo"
      );

      expect(result).toBe("2024-W03");
    });

    it("データが存在しない場合、nullを返す", async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockResolvedValue([] as never);

      const result = await dataStorage.getLastCollectedWeek(
        "testowner",
        "testrepo"
      );

      expect(result).toBeNull();
    });
  });

  describe("getAllWeeksData", () => {
    it("すべての週のデータを取得し、ソートして返す", async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockReaddir = vi.mocked(fs.readdir);
      const mockReadFile = vi.mocked(fs.readFile);
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        "2024-W02.json",
        "2024-W01.json",
      ] as never);
      mockReadFile
        .mockResolvedValueOnce(
          JSON.stringify({ ...mockWeeklyData, week: "2024-W02" })
        )
        .mockResolvedValueOnce(
          JSON.stringify({ ...mockWeeklyData, week: "2024-W01" })
        );

      const result = await dataStorage.getAllWeeksData("testowner", "testrepo");

      expect(result).toHaveLength(2);
      expect(result[0].week).toBe("2024-W01");
      expect(result[1].week).toBe("2024-W02");
    });
  });

  describe("getDataByDateRange", () => {
    it("指定された日付範囲のデータを返す", async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockReaddir = vi.mocked(fs.readdir);
      const mockReadFile = vi.mocked(fs.readFile);

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        "2024-W01.json",
        "2024-W02.json",
        "2024-W03.json",
      ] as never);
      mockReadFile
        .mockResolvedValueOnce(
          JSON.stringify({ ...mockWeeklyData, week: "2024-W01" })
        )
        .mockResolvedValueOnce(
          JSON.stringify({ ...mockWeeklyData, week: "2024-W02" })
        )
        .mockResolvedValueOnce(
          JSON.stringify({ ...mockWeeklyData, week: "2024-W03" })
        );

      const result = await dataStorage.getDataByDateRange(
        "testowner",
        "testrepo",
        "2024-01-08", // 2024-W02に相当
        "2024-01-14" // 2024-W02に相当
      );

      expect(result).toHaveLength(1);
      expect(result[0].week).toBe("2024-W02");
    });
  });

  describe("getAvailableRepositories", () => {
    it("利用可能なリポジトリのリストを返す", async () => {
      const mockAccess = vi.mocked(fs.access);
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);

      // ensureDirectoryExists用のaccess
      mockAccess.mockResolvedValue(undefined);

      // 複雑なモックの設定 - 実際の呼び出し順序に合わせる
      const mockIsDirectory = vi.fn().mockReturnValue(true);
      mockStat.mockResolvedValue({ isDirectory: mockIsDirectory } as never);

      mockReaddir
        .mockResolvedValueOnce(["owner1"] as never) // baseDir
        .mockResolvedValueOnce(["repo1"] as never) // owner1
        .mockResolvedValueOnce(["2024-W01.json"] as never); // owner1/repo1

      const result = await dataStorage.getAvailableRepositories();

      expect(result).toEqual([{ owner: "owner1", repo: "repo1" }]);
    });

    it("エラーが発生した場合、空配列を返す", async () => {
      const mockAccess = vi.mocked(fs.access);
      mockAccess.mockRejectedValue(new Error("Access denied"));

      const result = await dataStorage.getAvailableRepositories();

      expect(result).toEqual([]);
    });
  });
});
