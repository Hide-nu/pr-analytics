import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Octokit } from "@octokit/rest";

// Octokitをモック化
vi.mock("@octokit/rest");

describe("github", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("octokitインスタンスが正しく作成される", async () => {
    // 環境変数をモック
    const originalEnv = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = "test-token";

    // モジュールを動的にインポート
    const githubModule = await import("../github");

    expect(githubModule.octokit).toBeDefined();
    expect(Octokit).toHaveBeenCalledWith({ auth: "test-token" });

    // 環境変数を復元
    process.env.GITHUB_TOKEN = originalEnv;
  });

  it("環境変数が設定されていない場合でもoctokitインスタンスが作成される", async () => {
    // 環境変数をクリア
    const originalEnv = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;

    // モジュールを動的にインポート
    const githubModule = await import("../github");

    expect(githubModule.octokit).toBeDefined();
    expect(Octokit).toHaveBeenCalledWith({ auth: undefined });

    // 環境変数を復元
    if (originalEnv) {
      process.env.GITHUB_TOKEN = originalEnv;
    }
  });
});
