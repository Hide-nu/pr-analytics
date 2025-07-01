#!/usr/bin/env node

import { spawn } from "child_process";
import { existsSync } from "fs";

/**
 * 共通ユーティリティ関数
 * 複数のスクリプト間で重複している処理をまとめたモジュール
 */

// 待機用のユーティリティ
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 環境チェック
export function checkEnvironment() {
  console.log("🔍 Checking environment...");

  const requiredFiles = ["package.json", "next.config.ts"];
  console.log("📁 Required files:");

  let allFilesExist = true;
  requiredFiles.forEach((file) => {
    const exists = existsSync(file);
    console.log(`  ${exists ? "✅" : "❌"} ${file}`);
    if (!exists) allFilesExist = false;
  });

  if (!allFilesExist) {
    console.error("❌ Required files missing");
    process.exit(1);
  }

  // GITHUB_TOKENの確認
  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN is not set!");
    console.log("📝 Please set your GitHub Personal Access Token");
    process.exit(1);
  }

  console.log("✅ Environment check passed");
}

// サーバー起動処理
export function startServer() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting server...");

    const serverProcess = spawn("npm", ["start"], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    let output = "";
    let errorOutput = "";

    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;

      // Next.js の起動完了を検出
      if (
        text.includes("Ready") ||
        text.includes("ready") ||
        text.includes("Local:")
      ) {
        console.log("✅ Server startup detected");
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    serverProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ Server process exited with code ${code}`);
        console.error("STDOUT:", output);
        console.error("STDERR:", errorOutput);
        reject(new Error(`Server failed to start (exit code: ${code})`));
      }
    });

    serverProcess.on("error", (error) => {
      console.error("❌ Failed to start server process:", error);
      reject(error);
    });

    // タイムアウト設定（30秒）
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.log("⏰ Server startup timeout, but continuing...");
        resolve(serverProcess);
      }
    }, 30000);
  });
}

// サーバー接続確認
export async function waitForServer(maxAttempts = 30) {
  let attempts = 0;
  console.log("⏳ Waiting for server to be ready...");

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:3000/api/repositories", {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log("✅ Server is ready and responding");
        return true;
      } else {
        console.log(`HTTP ${response.status} - Server not ready yet`);
      }
    } catch (error) {
      if (error.name === "TimeoutError") {
        console.log(
          `Attempt ${attempts + 1}/${maxAttempts} - Connection timeout`
        );
      } else {
        console.log(
          `Attempt ${attempts + 1}/${maxAttempts} - ${error.message}`
        );
      }
    }

    attempts++;
    await wait(2000);
  }

  throw new Error("❌ Server failed to respond within timeout period");
}

// サーバー停止処理
export function stopServer(serverProcess) {
  if (serverProcess && !serverProcess.killed) {
    console.log("🛑 Stopping server...");

    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
      } else {
        process.kill(-serverProcess.pid, "SIGTERM");
      }

      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill("SIGKILL");
        }
      }, 5000);

      console.log("✅ Server stopped");
    } catch (error) {
      console.log(
        "⚠️ Server stop failed (may have already stopped):",
        error.message
      );
    }
  }
}

// API エンドポイントテスト
export async function testApiEndpoints(repositories = []) {
  console.log("🧪 Testing API endpoints...");

  // リポジトリ一覧の取得テスト
  try {
    console.log("Testing repositories endpoint...");
    const response = await fetch("http://localhost:3000/api/repositories");
    if (!response.ok) {
      throw new Error(`Repositories API failed: HTTP ${response.status}`);
    }
    console.log("✅ Repositories API working");
  } catch (error) {
    console.error("❌ Repositories API test failed:", error.message);
    return false;
  }

  // 指定されたリポジトリがない場合は基本テストのみ
  if (repositories.length === 0) {
    console.log("⚠️ No repositories specified for detailed testing");
    return true;
  }

  // 各リポジトリのAPIテスト
  for (const repo of repositories.slice(0, 2)) {
    // 最初の2つのリポジトリのみテスト
    const { owner, repo: repoName } = repo;

    try {
      console.log(`Testing ${owner}/${repoName}...`);

      // データ収集情報の取得テスト
      const dataResponse = await fetch(
        `http://localhost:3000/api/collect-data?owner=${owner}&repo=${repoName}`
      );
      if (!dataResponse.ok) {
        throw new Error(`Collect-data API failed: HTTP ${dataResponse.status}`);
      }

      // アナリティクスAPIの取得テスト
      const analyticsResponse = await fetch(
        `http://localhost:3000/api/analytics?owner=${owner}&repo=${repoName}&weeks=4`
      );
      if (!analyticsResponse.ok) {
        throw new Error(
          `Analytics API failed: HTTP ${analyticsResponse.status}`
        );
      }

      console.log(`✅ APIs working for ${owner}/${repoName}`);
    } catch (error) {
      console.error(
        `❌ API test failed for ${owner}/${repoName}:`,
        error.message
      );
      return false;
    }
  }

  return true;
}

// データ整合性チェック
export async function checkDataIntegrity() {
  const fs = await import("fs");
  const path = await import("path");

  console.log("📊 Checking data integrity...");

  const dataDir = "data/weekly";
  let totalFiles = 0;
  let validFiles = 0;
  const issues = [];

  if (!fs.existsSync(dataDir)) {
    console.log("⚠️ No data directory found");
    return { totalFiles: 0, validFiles: 0, issues: ["No data directory"] };
  }

  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith(".json")) {
        totalFiles++;
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(content);

          // 基本的な構造チェック
          if (
            !data.week ||
            !data.pullRequests ||
            !Array.isArray(data.pullRequests)
          ) {
            issues.push(`Invalid structure: ${filePath}`);
          } else {
            validFiles++;

            // 詳細データチェック
            data.pullRequests.forEach((pr, index) => {
              if (!pr.number || !pr.title || !pr.created_at) {
                issues.push(
                  `Missing required fields in ${filePath} PR[${index}]`
                );
              }
            });
          }
        } catch (error) {
          issues.push(`JSON parse error: ${filePath} - ${error.message}`);
        }
      }
    });
  };

  walkDir(dataDir);

  console.log(`📈 Integrity check: ${validFiles}/${totalFiles} files valid`);
  if (issues.length > 0) {
    console.log("⚠️ Issues found:");
    issues.slice(0, 5).forEach((issue) => console.log(`  - ${issue}`));
    if (issues.length > 5) {
      console.log(`  ... and ${issues.length - 5} more issues`);
    }
  } else {
    console.log("✅ All data files are valid");
  }

  return { totalFiles, validFiles, issues };
}

// エラーハンドリングとクリーンアップ
export function setupProcessHandlers(serverProcess) {
  const cleanup = () => {
    if (serverProcess) {
      stopServer(serverProcess);
    }
    process.exit(0);
  };

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    cleanup();
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    cleanup();
  });

  process.on("SIGINT", () => {
    console.log("\n🔴 Received SIGINT, stopping...");
    cleanup();
  });

  process.on("SIGTERM", () => {
    console.log("\n🔴 Received SIGTERM, stopping...");
    cleanup();
  });
}
