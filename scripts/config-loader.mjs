#!/usr/bin/env node

/**
 * Configuration Loader Utility
 * リポジトリ設定の一元管理を提供
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 設定ファイルのパス
 */
const CONFIG_PATH = path.join(__dirname, "../config/repositories.json");

/**
 * リポジトリ設定を読み込む
 * @param {string} [type='default'] - 読み込む設定タイプ
 * @returns {Array<{owner: string, repo: string}>} リポジトリ設定配列
 */
export function loadRepositories(type = "default") {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`Configuration file not found: ${CONFIG_PATH}`);
    }

    const configData = fs.readFileSync(CONFIG_PATH, "utf8");
    const config = JSON.parse(configData);

    if (!config[type]) {
      throw new Error(
        `Configuration type '${type}' not found in repositories.json`
      );
    }

    const repositories = config[type];

    // バリデーション
    validateRepositories(repositories, config.validation);

    console.log(
      `✅ Loaded ${repositories.length} repositories from config (type: ${type})`
    );
    return repositories;
  } catch (error) {
    console.error("❌ Failed to load repository configuration:", error.message);

    // フォールバック設定
    const fallback = [];

    console.warn("⚠️ Using fallback repository configuration");
    return fallback;
  }
}

/**
 * リポジトリ設定をJSON文字列として取得
 * GitHub Actions環境変数用
 * @param {string} [type='default'] - 設定タイプ
 * @returns {string} JSON文字列
 */
export function getRepositoriesJson(type = "default") {
  const repositories = loadRepositories(type);
  return JSON.stringify(repositories);
}

/**
 * リポジトリ設定の検証
 * @param {Array} repositories - リポジトリ配列
 * @param {Object} validation - バリデーション設定
 */
function validateRepositories(repositories, validation = {}) {
  if (!Array.isArray(repositories)) {
    throw new Error("Repositories must be an array");
  }

  const { requiredFields = ["owner", "repo"], maxRepositories = 10 } =
    validation;

  if (repositories.length === 0) {
    throw new Error("At least one repository must be configured");
  }

  if (repositories.length > maxRepositories) {
    throw new Error(
      `Too many repositories configured. Maximum allowed: ${maxRepositories}`
    );
  }

  repositories.forEach((repo, index) => {
    requiredFields.forEach((field) => {
      if (!repo[field] || typeof repo[field] !== "string") {
        throw new Error(
          `Repository ${index}: Missing or invalid '${field}' field`
        );
      }
    });

    // GitHub リポジトリ名の基本検証
    if (!/^[a-zA-Z0-9._-]+$/.test(repo.owner)) {
      throw new Error(
        `Repository ${index}: Invalid owner name '${repo.owner}'`
      );
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(repo.repo)) {
      throw new Error(`Repository ${index}: Invalid repo name '${repo.repo}'`);
    }
  });
}

/**
 * 設定ファイルの更新
 * @param {Array} repositories - 新しいリポジトリ設定
 * @param {string} [type='default'] - 設定タイプ
 */
export function updateRepositories(repositories, type = "default") {
  try {
    let config = {};

    // 既存設定の読み込み
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, "utf8");
      config = JSON.parse(configData);
    }

    // バリデーション
    validateRepositories(repositories, config.validation);

    // 設定更新
    config[type] = repositories;
    config.metadata = {
      ...config.metadata,
      lastUpdated: new Date().toISOString(),
    };

    // ファイル書き込み
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    console.log(`✅ Updated repository configuration (type: ${type})`);
  } catch (error) {
    console.error(
      "❌ Failed to update repository configuration:",
      error.message
    );
    throw error;
  }
}

/**
 * 設定ファイルの妥当性チェック
 * @returns {boolean} 妥当性
 */
export function validateConfig() {
  try {
    loadRepositories("default");
    console.log("✅ Repository configuration is valid");
    return true;
  } catch (error) {
    console.error(
      "❌ Repository configuration validation failed:",
      error.message
    );
    return false;
  }
}

// CLI実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "validate":
      process.exit(validateConfig() ? 0 : 1);
      break;

    case "load":
      const type = process.argv[3] || "default";
      console.log(JSON.stringify(loadRepositories(type), null, 2));

    case "json":
      const jsonType = process.argv[3] || "default";
      console.log(getRepositoriesJson(jsonType));
      break;

    default:
      console.log(`
Usage: node config-loader.mjs <command>

Commands:
  validate     - Validate repository configuration
  load [type]  - Load and display repositories (default: 'default')
  json [type]  - Output repositories as JSON string for env vars
      `);
      process.exit(1);
  }
}
