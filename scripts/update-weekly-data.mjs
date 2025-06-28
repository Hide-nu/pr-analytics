import { execSync } from "child_process";
import { getISOWeek, getYear } from "date-fns";

// アプリケーション用の環境設定
process.env.NODE_ENV = "production";

// Next.jsビルド（本番環境のため）
console.log("Building Next.js application...");
try {
  execSync("npm run build", { stdio: "inherit" });
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}

// サーバーを開始
console.log("Starting server for data collection...");
execSync("npm start &", { encoding: "utf8" });

// サーバーが起動するまで待機
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:3000/api/repositories");
      if (response.ok) {
        console.log("Server is ready");
        return;
      }
    } catch {
      // サーバーがまだ起動していない
    }

    attempts++;
    console.log(`Waiting for server... (${attempts}/${maxAttempts})`);
    await wait(2000);
  }

  throw new Error("Server failed to start within timeout");
}

async function getCurrentWeek() {
  const now = new Date();
  const year = getYear(now);
  const week = getISOWeek(now);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

async function getRegisteredRepositories() {
  try {
    const response = await fetch("http://localhost:3000/api/repositories");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.repositories;
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return [];
  }
}

async function updateRepositoryData(owner, repo) {
  const currentWeek = await getCurrentWeek();
  const forceUpdate = process.env.FORCE_UPDATE === "true";

  console.log(`Updating data for ${owner}/${repo} (week: ${currentWeek})`);

  try {
    // 既存データをチェック
    if (!forceUpdate) {
      const checkResponse = await fetch(
        `http://localhost:3000/api/collect-data?owner=${owner}&repo=${repo}`
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.availableWeeks?.includes(currentWeek)) {
          console.log(
            `Data for ${owner}/${repo} week ${currentWeek} already exists, skipping...`
          );
          return { success: true, skipped: true };
        }
      }
    }

    // データ収集
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
    console.log(`✅ Successfully updated ${owner}/${repo}: ${data.message}`);

    return {
      success: true,
      data: data,
      prCount: data.prCount,
    };
  } catch (error) {
    console.error(`❌ Failed to update ${owner}/${repo}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  try {
    console.log("🚀 Starting weekly data update process...");

    // サーバー起動待機
    await waitForServer();

    // 登録済みリポジトリを取得
    const repositories = await getRegisteredRepositories();

    if (repositories.length === 0) {
      console.log("No repositories found to update");
      return;
    }

    console.log(`Found ${repositories.length} repositories to update:`);
    repositories.forEach((repo) => {
      console.log(`  - ${repo.owner}/${repo.repo}`);
    });

    // 各リポジトリのデータを更新
    const results = [];

    for (const repo of repositories) {
      const result = await updateRepositoryData(repo.owner, repo.repo);
      results.push({
        repository: `${repo.owner}/${repo.repo}`,
        ...result,
      });

      // APIレート制限を避けるため少し待機
      await wait(1000);
    }

    // 結果サマリー
    console.log("\n📊 Update Summary:");
    const successful = results.filter((r) => r.success && !r.skipped);
    const skipped = results.filter((r) => r.success && r.skipped);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Successfully updated: ${successful.length}`);
    console.log(`⏭️  Skipped (already exists): ${skipped.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log("\nSuccessful updates:");
      successful.forEach((r) => {
        console.log(`  - ${r.repository}: ${r.prCount} PRs processed`);
      });
    }

    if (failed.length > 0) {
      console.log("\nFailed updates:");
      failed.forEach((r) => {
        console.log(`  - ${r.repository}: ${r.error}`);
      });
    }

    // 失敗があった場合はエラーで終了
    if (failed.length > 0) {
      process.exit(1);
    }

    console.log("\n✨ Weekly data update completed successfully!");
  } catch (error) {
    console.error("Fatal error during update process:", error);
    process.exit(1);
  } finally {
    // サーバーを停止
    try {
      execSync('pkill -f "node.*next"', { stdio: "ignore" });
    } catch {
      // プロセスが見つからない場合は無視
    }
  }
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
