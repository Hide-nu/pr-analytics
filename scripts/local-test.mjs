#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync } from "fs";
import { getISOWeek, getYear } from "date-fns";

// 環境設定チェック
function checkEnvironment() {
  console.log("🔍 Checking local environment...");

  // .env.localファイルの存在確認
  if (!existsSync(".env.local")) {
    console.error("❌ .env.local file not found!");
    console.log(
      "📝 Please copy .env.local.example to .env.local and configure it"
    );
    console.log("   cp .env.local.example .env.local");
    process.exit(1);
  }

  // GITHUB_TOKENの確認
  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN is not set!");
    console.log(
      "📝 Please set your GitHub Personal Access Token in .env.local"
    );
    process.exit(1);
  }

  // トークンの形式確認（基本的なチェック）
  const token = process.env.GITHUB_TOKEN;
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    console.warn("⚠️  Warning: Token format might be invalid");
    console.log("   Expected format: ghp_... or github_pat_...");
  }

  console.log("✅ Environment check passed");
}

// サーバーが起動するまで待機
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const maxAttempts = 15; // ローカルなので短縮
  let attempts = 0;

  console.log("⏳ Waiting for local server to start...");

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:3000/api/repositories");
      if (response.ok) {
        console.log("✅ Local server is ready");
        return;
      }
    } catch {
      // サーバーがまだ起動していない
    }

    attempts++;
    console.log(`   Attempt ${attempts}/${maxAttempts}...`);
    await wait(2000);
  }

  throw new Error("❌ Local server failed to start within timeout");
}

async function testRepositoryConnection() {
  console.log("🔗 Testing repository connection...");

  try {
    const response = await fetch("http://localhost:3000/api/repositories");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(
      `✅ Found ${data.repositories.length} registered repositories:`
    );

    data.repositories.forEach((repo, index) => {
      console.log(`   ${index + 1}. ${repo.owner}/${repo.repo}`);
    });

    return data.repositories;
  } catch (error) {
    console.error("❌ Repository connection failed:", error.message);
    throw error;
  }
}

async function testSingleRepository(owner, repo) {
  console.log(`\n🧪 Testing data collection for ${owner}/${repo}...`);

  const currentWeek = getCurrentWeek();

  try {
    // 既存データチェック
    const checkResponse = await fetch(
      `http://localhost:3000/api/collect-data?owner=${owner}&repo=${repo}`
    );

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log(`📊 Current week: ${currentWeek}`);
      console.log(
        `📁 Available weeks: ${checkData.availableWeeks?.length || 0}`
      );

      if (checkData.availableWeeks?.includes(currentWeek)) {
        console.log(`⚠️  Data for week ${currentWeek} already exists`);
        console.log(`   Use FORCE_UPDATE=true to override`);
      }
    }

    // データ収集テスト（DRY_RUNモードの場合は実際には実行しない）
    if (process.env.DRY_RUN === "true") {
      console.log("🏃 DRY_RUN mode - skipping actual data collection");
      return { success: true, skipped: true, reason: "dry_run" };
    }

    console.log("📥 Collecting data...");
    const response = await fetch("http://localhost:3000/api/collect-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner,
        repo,
        week: currentWeek,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `HTTP ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`✅ Success: ${data.message}`);
    console.log(`📈 Processed ${data.prCount || 0} PRs`);

    return { success: true, data: data };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function getCurrentWeek() {
  const now = new Date();
  const year = getYear(now);
  const week = getISOWeek(now);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

async function main() {
  try {
    console.log("🚀 PR Analytics - Local Test Script");
    console.log("===================================\n");

    // 環境チェック
    checkEnvironment();

    // 開発サーバーを起動
    console.log("\n🏗️  Building and starting development server...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      console.log("✅ Build completed");
    } catch (error) {
      console.error("❌ Build failed:", error);
      process.exit(1);
    }

    // サーバー起動
    console.log("🚀 Starting server...");
    execSync("npm start &", { encoding: "utf8" });

    // サーバー起動待機
    await waitForServer();

    // リポジトリ接続テスト
    const repositories = await testRepositoryConnection();

    if (repositories.length === 0) {
      console.log("⚠️  No repositories found to test");
      return;
    }

    // 最初のリポジトリでテスト実行
    const testRepo = repositories[0];
    const result = await testSingleRepository(testRepo.owner, testRepo.repo);

    console.log("\n📊 Test Summary:");
    if (result.success) {
      if (result.skipped) {
        console.log("⏭️  Test completed (skipped)");
        if (result.reason === "dry_run") {
          console.log("   Reason: DRY_RUN mode");
        }
      } else {
        console.log("✅ Test completed successfully");
      }
    } else {
      console.log("❌ Test failed");
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error("💥 Fatal error during test:", error);
    process.exit(1);
  } finally {
    // サーバーを停止
    console.log("\n🛑 Stopping server...");
    try {
      execSync('pkill -f "node.*next"', { stdio: "ignore" });
      console.log("✅ Server stopped");
    } catch {
      console.log("⚠️  Server process not found (may have already stopped)");
    }
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
PR Analytics - Local Test Script

Usage:
  npm run test:local              # 通常のテスト実行
  npm run test:local:dry          # ドライラン（データ収集しない）
  npm run test:local:force        # 強制更新テスト

Environment Variables:
  GITHUB_TOKEN    GitHub Personal Access Token (required)
  DRY_RUN        true/false - ドライランモード
  FORCE_UPDATE   true/false - 強制更新モード

Setup:
  1. cp .env.local.example .env.local
  2. Edit .env.local and set your GITHUB_TOKEN
  3. npm run test:local
`);
  process.exit(0);
}

// 未処理の例外をキャッチ
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// スクリプト実行
main();
