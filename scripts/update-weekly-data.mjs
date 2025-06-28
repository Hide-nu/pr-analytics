import { spawn } from "child_process";
import { getISOWeek, getYear } from "date-fns";

// アプリケーション用の環境設定
process.env.NODE_ENV = "production";

// Next.jsビルド（本番環境のため）
console.log("Building Next.js application...");
try {
  const { execSync } = await import("child_process");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build completed");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}

// サーバー起動用の変数
let serverProcess = null;

// サーバーを開始（修正版）
function startServer() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting server for data collection...");

    // npm start をバックグラウンドで実行
    serverProcess = spawn("npm", ["start"], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32", // Windows以外では分離プロセス
    });

    let output = "";
    let errorOutput = "";

    // 標準出力の監視
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
        resolve();
      }
    });

    // エラー出力の監視
    serverProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // プロセス終了時の処理
    serverProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ Server process exited with code ${code}`);
        console.error("STDOUT:", output);
        console.error("STDERR:", errorOutput);
        reject(new Error(`Server failed to start (exit code: ${code})`));
      }
    });

    // プロセス開始エラーの処理
    serverProcess.on("error", (error) => {
      console.error("❌ Failed to start server process:", error);
      reject(error);
    });

    // タイムアウト設定（30秒）
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.log(
          "⏰ Server startup timeout, but continuing with connection test..."
        );
        resolve(); // タイムアウトでも接続テストを試行
      }
    }, 30000);
  });
}

// サーバー接続確認（改良版）
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const maxAttempts = 30;
  let attempts = 0;

  console.log("⏳ Waiting for server to be ready...");

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:3000/api/repositories", {
        signal: AbortSignal.timeout(5000), // 5秒タイムアウト
      });

      if (response.ok) {
        console.log("✅ Server is ready and responding");
        return;
      } else {
        console.log(`   HTTP ${response.status} - Server not ready yet`);
      }
    } catch (error) {
      if (error.name === "TimeoutError") {
        console.log(
          `   Attempt ${attempts + 1}/${maxAttempts} - Connection timeout`
        );
      } else {
        console.log(
          `   Attempt ${attempts + 1}/${maxAttempts} - ${error.message}`
        );
      }
    }

    attempts++;
    await wait(2000);
  }

  throw new Error("❌ Server failed to respond within timeout period");
}

// サーバー停止（改良版）
function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    console.log("🛑 Stopping server...");

    try {
      if (process.platform === "win32") {
        // Windows
        spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
      } else {
        // Unix系
        process.kill(-serverProcess.pid, "SIGTERM");
      }

      // 強制終了のバックアップ
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

// 過去N週間のリストを取得（デフォルト52週間 = 1年分）
function getRecentWeeks(weeksCount = 52) {
  const weeks = [];
  const now = new Date();

  for (let i = weeksCount - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const year = getYear(date);
    const week = getISOWeek(date);
    weeks.push(`${year}-W${week.toString().padStart(2, "0")}`);
  }

  return weeks;
}

async function getTargetRepositories() {
  try {
    // 環境変数からリポジトリ配列を取得
    const repositoriesEnv = process.env.TARGET_REPOSITORIES;
    if (!repositoriesEnv) {
      console.error("TARGET_REPOSITORIES environment variable is not set");
      return [];
    }

    const repositories = JSON.parse(repositoriesEnv);

    if (!Array.isArray(repositories)) {
      console.error("TARGET_REPOSITORIES must be a JSON array");
      return [];
    }

    // 配列の各要素がowner/repo形式になっているかを検証
    const validRepositories = repositories.filter((repo) => {
      if (!repo.owner || !repo.repo) {
        console.warn(
          `Invalid repository format: ${JSON.stringify(repo)} - skipping`
        );
        return false;
      }
      return true;
    });

    return validRepositories;
  } catch (error) {
    console.error("Failed to parse TARGET_REPOSITORIES:", error);
    return [];
  }
}

async function updateRepositoryData(owner, repo) {
  const forceUpdate = process.env.FORCE_UPDATE === "true";
  const targetWeeks = getRecentWeeks(52); // 過去1年分（52週間）

  console.log(
    `Checking data for ${owner}/${repo} (${targetWeeks.length} weeks)`
  );

  try {
    // 既存データをチェック
    let availableWeeks = [];
    if (!forceUpdate) {
      const checkResponse = await fetch(
        `http://localhost:3000/api/collect-data?owner=${owner}&repo=${repo}`
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        availableWeeks = checkData.availableWeeks || [];
      }
    }

    // 不足している週を特定
    const missingWeeks = targetWeeks.filter(
      (week) => forceUpdate || !availableWeeks.includes(week)
    );

    if (missingWeeks.length === 0) {
      console.log(
        `✅ All data for ${owner}/${repo} is up to date (${availableWeeks.length} weeks)`
      );
      return {
        success: true,
        skipped: true,
        totalWeeks: targetWeeks.length,
        availableWeeks: availableWeeks.length,
      };
    }

    console.log(
      `📥 Need to collect ${missingWeeks.length} weeks of data for ${owner}/${repo}`
    );
    console.log(
      `   Missing weeks: ${missingWeeks.slice(0, 5).join(", ")}${
        missingWeeks.length > 5 ? "..." : ""
      }`
    );

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 各週のデータを順次取得
    for (const week of missingWeeks) {
      try {
        const response = await fetch("http://localhost:3000/api/collect-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner,
            repo,
            week,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `HTTP ${response.status}: ${errorData.error || response.statusText}`
          );
        }

        await response.json(); // レスポンスを消費
        successCount++;

        // 進捗表示（5週ごと、または最後の週）
        if (successCount % 5 === 0 || successCount === missingWeeks.length) {
          console.log(
            `   Progress: ${successCount}/${missingWeeks.length} weeks completed`
          );
        }

        // APIレート制限を避けるため少し待機
        await wait(500);
      } catch (error) {
        errorCount++;
        errors.push(`Week ${week}: ${error.message}`);
        console.error(`   ❌ Failed to collect week ${week}: ${error.message}`);

        // エラーが続く場合は少し長めに待機
        await wait(1000);
      }
    }

    const message = `Collected ${successCount} weeks, ${errorCount} errors`;

    if (errorCount > 0) {
      console.log(`⚠️  ${owner}/${repo}: ${message}`);
      return {
        success: successCount > 0,
        partial: true,
        successCount,
        errorCount,
        errors: errors.slice(0, 3), // 最初の3つのエラーのみ
        message,
      };
    } else {
      console.log(`✅ ${owner}/${repo}: ${message}`);
      return {
        success: true,
        successCount,
        errorCount: 0,
        message,
      };
    }
  } catch (error) {
    console.error(`❌ Failed to process ${owner}/${repo}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  try {
    console.log("🚀 Starting weekly data update process...");

    // サーバー起動（データ収集API用）
    await startServer();

    // サーバー接続確認
    await waitForServer();

    // 環境変数から対象リポジトリを取得
    const repositories = await getTargetRepositories();

    if (repositories.length === 0) {
      console.log("No target repositories configured or found");
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
    const successful = results.filter(
      (r) => r.success && !r.skipped && !r.partial
    );
    const partial = results.filter((r) => r.success && r.partial);
    const skipped = results.filter((r) => r.success && r.skipped);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Fully successful: ${successful.length}`);
    console.log(`⚠️  Partially successful: ${partial.length}`);
    console.log(`⏭️  Skipped (up to date): ${skipped.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
      console.log("\nFully successful updates:");
      successful.forEach((r) => {
        console.log(`  - ${r.repository}: ${r.successCount} weeks collected`);
      });
    }

    if (partial.length > 0) {
      console.log("\nPartially successful updates:");
      partial.forEach((r) => {
        console.log(
          `  - ${r.repository}: ${r.successCount} weeks collected, ${r.errorCount} errors`
        );
      });
    }

    if (skipped.length > 0) {
      console.log("\nSkipped repositories:");
      skipped.forEach((r) => {
        console.log(
          `  - ${r.repository}: ${r.availableWeeks}/${r.totalWeeks} weeks available`
        );
      });
    }

    if (failed.length > 0) {
      console.log("\nFailed updates:");
      failed.forEach((r) => {
        console.log(`  - ${r.repository}: ${r.error}`);
      });
    }

    // 完全失敗があった場合はエラーで終了
    if (failed.length > 0) {
      console.log(`\n❌ ${failed.length} repositories failed completely`);
      process.exit(1);
    }

    // 部分的失敗がある場合は警告で終了
    if (partial.length > 0) {
      console.log(
        `\n⚠️ Weekly data update completed with ${partial.length} partial failures`
      );
    } else {
      console.log("\n✨ Weekly data update completed successfully!");
    }
  } catch (error) {
    console.error("Fatal error during update process:", error);
    process.exit(1);
  } finally {
    // サーバーを停止
    stopServer();
  }
}

// 未処理の例外をキャッチ
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  stopServer();
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  stopServer();
  process.exit(1);
});

// 終了シグナルのハンドリング
process.on("SIGINT", () => {
  console.log("\n🔴 Received SIGINT, stopping server...");
  stopServer();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🔴 Received SIGTERM, stopping server...");
  stopServer();
  process.exit(0);
});

// スクリプト実行
main();
