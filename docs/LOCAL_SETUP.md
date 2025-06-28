# ローカル環境でのテスト実行セットアップ

PR Analytics のデータ更新機能をローカル環境でテストするための手順です。

## 🚀 クイックスタート

```bash
# 1. 環境設定ファイルをコピー
cp .env.local.example .env.local

# 2. GitHub Personal Access Token を設定
# .env.local を編集して GITHUB_TOKEN を設定

# 3. テスト実行
npm run test:local
```

## 📋 詳細セットアップ手順

### 1. GitHub Personal Access Token の取得

1. **GitHub にログイン**し、[Personal Access Tokens](https://github.com/settings/tokens) ページに移動

2. **"Generate new token (classic)"** をクリック

3. **以下の設定を行います**：

   - Token name: `PR Analytics Local Development`
   - Expiration: `90 days` または必要に応じて
   - Select scopes:
     - ✅ `repo` - プライベートリポジトリへのフルアクセス
     - ✅ `read:org` - 組織の読み取り権限

4. **"Generate token"** をクリックしてトークンを生成

5. **⚠️ 重要**: 生成されたトークンをコピーして安全な場所に保存
   （このページを閉じると二度と表示されません）

### 2. 環境変数の設定

```bash
# サンプルファイルをコピー
cp .env.local.example .env.local

# エディタで .env.local を開く
nano .env.local
# または
code .env.local
```

`.env.local` ファイルの内容を編集：

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_your_actual_token_here

# その他の設定（オプション）
FORCE_UPDATE=false
NODE_ENV=development
```

### 3. 依存関係のインストール

```bash
npm install
```

## 🧪 テスト実行方法

### 基本的なテスト

```bash
# 通常のテスト実行
npm run test:local

# ヘルプの表示
npm run test:local -- --help
```

### 各種テストモード

```bash
# ドライラン（実際にはデータを保存しない）
npm run test:local:dry

# 強制更新テスト（既存データを上書き）
npm run test:local:force

# 手動での環境変数指定
DRY_RUN=true FORCE_UPDATE=true npm run test:local
```

## 📊 テスト実行結果の見方

### 成功時の出力例

```
🚀 PR Analytics - Local Test Script
===================================

🔍 Checking local environment...
✅ Environment check passed

🏗️  Building and starting development server...
✅ Build completed
🚀 Starting server...
⏳ Waiting for local server to start...
✅ Local server is ready

🔗 Testing repository connection...
✅ Found 3 registered repositories:
   1. ***REMOVED***/***REMOVED***
   2. randombar164/ouchi_bar
   3. tt/tt

🧪 Testing data collection for ***REMOVED***/***REMOVED***...
📊 Current week: 2025-W26
📁 Available weeks: 52
⚠️  Data for week 2025-W26 already exists
   Use FORCE_UPDATE=true to override
🏃 DRY_RUN mode - skipping actual data collection

📊 Test Summary:
⏭️  Test completed (skipped)
   Reason: DRY_RUN mode

🛑 Stopping server...
✅ Server stopped
```

## ⚠️ トラブルシューティング

### よくある問題と解決方法

#### 1. GITHUB_TOKEN エラー

```
❌ GITHUB_TOKEN is not set!
```

**解決方法**:

- `.env.local` ファイルが存在するか確認
- `GITHUB_TOKEN=` の後に正しいトークンが設定されているか確認
- トークンの権限（`repo`, `read:org`）が設定されているか確認

#### 2. Token 形式エラー

```
⚠️  Warning: Token format might be invalid
```

**解決方法**:

- GitHub Personal Access Token は `ghp_` または `github_pat_` で始まる必要があります
- 古い形式のトークンの場合は新しく生成し直してください

#### 3. サーバー起動エラー

```
❌ Local server failed to start within timeout
```

**解決方法**:

- ポート 3000 が他のプロセスで使用されていないか確認
- `npm run build` が正常に完了するか確認
- `npm start` を単体で実行してエラーを確認

#### 4. リポジトリ接続エラー

```
❌ Repository connection failed
```

**解決方法**:

- `data/weekly/` ディレクトリに登録済みリポジトリがあるか確認
- GitHub トークンの権限でアクセス可能なリポジトリか確認

#### 5. データ収集エラー

**よくあるエラー**:

- `HTTP 401`: 認証エラー - トークンの確認
- `HTTP 403`: レート制限 - 時間をおいて再実行
- `HTTP 404`: リポジトリが見つからない - リポジトリ名の確認

## 🔒 セキュリティ注意事項

### Personal Access Token の管理

- **絶対に公開リポジトリにコミットしない**
- **チームメンバーとの共有は避ける**
- **定期的にトークンをローテーション**
- **不要になったら無効化**

### .env.local ファイル

- `.gitignore` に含まれているため Git にコミットされません
- ローカル環境でのみ使用してください
- 本番環境では GitHub Actions の Secrets を使用

## 🎯 次のステップ

### 開発ワークフロー

1. **ローカルでテスト** → `npm run test:local:dry`
2. **実際のデータ収集テスト** → `npm run test:local`
3. **強制更新テスト** → `npm run test:local:force`
4. **GitHub Actions での実行**

### カスタマイズ

- `scripts/local-test.mjs` を編集して独自のテストロジックを追加
- 特定のリポジトリのみをテストする機能の追加
- 複数週のデータを一括テストする機能の追加

## 📞 サポート

問題が解決しない場合：

1. GitHub Issues でレポート
2. ログ出力をコピーして詳細を記載
3. 環境情報（OS、Node.js バージョン）を含める
