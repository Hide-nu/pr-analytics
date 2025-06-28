#!/usr/bin/env node

import { spawn, execSync } from "child_process";
import { existsSync } from "fs";

console.log("🔍 PR Analytics - Server Debug Script");
console.log("=====================================\n");

// 環境チェック
function checkEnvironment() {
  console.log("📋 Environment Check:");
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Architecture: ${process.arch}`);
  console.log(`  Working Directory: ${process.cwd()}`);

  // 必要なファイルの存在確認
  const requiredFiles = ["package.json", "next.config.ts", ".next/BUILD_ID"];

  console.log("\n📁 Required Files:");
  requiredFiles.forEach((file) => {
    const exists = existsSync(file);
    console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  });

  // ポートチェック
  console.log("\n🔌 Port Check:");
  try {
    execSync("lsof -i :3000", { encoding: "utf8", stdio: "pipe" });
    console.log("  ⚠️  Port 3000 is already in use");

    // 使用中のプロセスを表示
    try {
      const result = execSync("lsof -i :3000 -t", { encoding: "utf8" });
      const pids = result.trim().split("\n");
      console.log(`  📋 PIDs using port 3000: ${pids.join(", ")}`);
    } catch {
      // PID取得失敗は無視
    }
  } catch {
    console.log("  ✅ Port 3000 is available");
  }
}

// npm スクリプトの確認
function checkNpmScripts() {
  console.log("\n📦 NPM Scripts Check:");
  try {
    const packageJson = JSON.parse(
      execSync("cat package.json", { encoding: "utf8" })
    );
    const scripts = packageJson.scripts;

    console.log(`  build: ${scripts.build}`);
    console.log(`  start: ${scripts.start}`);

    return scripts;
  } catch {
    console.log("  ❌ Failed to read package.json");
    return null;
  }
}

// ビルドテスト
async function testBuild() {
  console.log("\n🏗️  Build Test:");

  try {
    console.log("  Running npm run build...");
    execSync("npm run build", { stdio: "inherit" });
    console.log("  ✅ Build successful");
    return true;
  } catch (error) {
    console.log("  ❌ Build failed");
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

// サーバー起動テスト
async function testServerStart() {
  console.log("\n🚀 Server Start Test:");

  return new Promise((resolve) => {
    console.log("  Starting server with spawn...");

    const serverProcess = spawn("npm", ["start"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";
    let isResolved = false;

    // 標準出力の監視
    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;

      console.log(`  📤 STDOUT: ${text.trim()}`);

      // Next.js の起動完了を検出
      if (
        text.includes("Ready") ||
        text.includes("ready") ||
        text.includes("Local:")
      ) {
        console.log("  ✅ Server startup detected in output");
        if (!isResolved) {
          isResolved = true;
          serverProcess.kill();
          resolve({ success: true, output, errorOutput });
        }
      }
    });

    // エラー出力の監視
    serverProcess.stderr.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log(`  📥 STDERR: ${text.trim()}`);
    });

    // プロセス終了時の処理
    serverProcess.on("close", (code) => {
      console.log(`  🔚 Process exited with code: ${code}`);
      if (!isResolved) {
        isResolved = true;
        resolve({ success: code === 0, output, errorOutput, exitCode: code });
      }
    });

    // プロセス開始エラーの処理
    serverProcess.on("error", (error) => {
      console.log(`  ❌ Process error: ${error.message}`);
      if (!isResolved) {
        isResolved = true;
        resolve({ success: false, error: error.message, output, errorOutput });
      }
    });

    // タイムアウト設定（15秒）
    setTimeout(() => {
      if (!isResolved) {
        console.log("  ⏰ Timeout reached (15s)");
        serverProcess.kill();
        isResolved = true;
        resolve({ success: false, timeout: true, output, errorOutput });
      }
    }, 15000);
  });
}

// 接続テスト
async function testConnection() {
  console.log("\n🔗 Connection Test:");

  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${maxAttempts}...`);

      const response = await fetch("http://localhost:3000/api/repositories", {
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        console.log("  ✅ Connection successful");
        const data = await response.json();
        console.log(
          `  📊 Found ${data.repositories?.length || 0} repositories`
        );
        return true;
      } else {
        console.log(`  ⚠️  HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  ❌ ${error.message}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("  ❌ Connection failed after all attempts");
  return false;
}

// メイン関数
async function main() {
  try {
    // 1. 環境チェック
    checkEnvironment();

    // 2. NPMスクリプトチェック
    const scripts = checkNpmScripts();
    if (!scripts) return;

    // 3. ビルドテスト
    const buildSuccess = await testBuild();
    if (!buildSuccess) {
      console.log("\n❌ Build failed. Please fix build errors first.");
      return;
    }

    // 4. サーバー起動テスト
    const startResult = await testServerStart();
    console.log("\n📊 Server Start Result:");
    console.log(`  Success: ${startResult.success}`);
    if (startResult.timeout) console.log("  Timeout: true");
    if (startResult.exitCode !== undefined)
      console.log(`  Exit Code: ${startResult.exitCode}`);
    if (startResult.error) console.log(`  Error: ${startResult.error}`);

    // 5. 接続テスト（別プロセスでサーバーを起動）
    console.log("\n🔄 Starting server for connection test...");
    const serverProcess = spawn("npm", ["start"], {
      stdio: ["ignore", "ignore", "ignore"],
      detached: true,
    });

    // 起動待機
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 接続テスト実行
    const connectionSuccess = await testConnection();

    // サーバー停止
    try {
      serverProcess.kill();
    } catch (error) {
      console.log(`⚠️  Failed to kill server process: ${error.message}`);
    }

    // 結果サマリー
    console.log("\n📊 Debug Summary:");
    console.log(`  Build: ${buildSuccess ? "✅" : "❌"}`);
    console.log(`  Server Start: ${startResult.success ? "✅" : "❌"}`);
    console.log(`  Connection: ${connectionSuccess ? "✅" : "❌"}`);

    if (buildSuccess && startResult.success && connectionSuccess) {
      console.log("\n🎉 All tests passed! The server should work correctly.");
    } else {
      console.log(
        "\n⚠️  Some tests failed. Please check the output above for details."
      );
    }
  } catch (error) {
    console.error("💥 Fatal error during debug:", error);
  }
}

main();
