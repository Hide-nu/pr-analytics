/**
 * 環境判定ユーティリティ
 * 本番環境、開発環境、Vercel環境などの判定を提供
 */

/**
 * 本番環境かどうかを判定
 * @returns {boolean} 本番環境の場合true
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * 開発環境かどうかを判定
 * @returns {boolean} 開発環境の場合true
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Vercel環境かどうかを判定
 * @returns {boolean} Vercel環境の場合true
 */
export function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * 本番環境またはVercel環境かどうかを判定
 * データ収集やファイル書き込みが制限される環境かどうかを判定
 * @returns {boolean} 制限環境の場合true
 */
export function isRestrictedEnvironment(): boolean {
  return isProduction() || isVercel();
}

/**
 * ローカル環境かどうかを判定
 * データ収集やファイル書き込みが可能な環境かどうかを判定
 * @returns {boolean} ローカル環境の場合true
 */
export function isLocalEnvironment(): boolean {
  return isDevelopment() && !isVercel();
}

/**
 * 環境情報を取得
 * @returns {object} 環境情報オブジェクト
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isVercel: isVercel(),
    isRestricted: isRestrictedEnvironment(),
    isLocal: isLocalEnvironment(),
    vercel: process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
  };
}
