This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# PR Analytics

GitHub Pull Request の分析を行う Next.js アプリケーションです。

## 機能

- GitHub API を使用した PR データの週次収集
- 自動データ更新システム（GitHub Actions）
- PR 統計データの可視化とダッシュボード

## 週次自動データ更新

### 概要

このプロジェクトでは、登録済みのリポジトリについて、毎週自動的に PR データを収集・更新するシステムが実装されています。

### 自動実行スケジュール

- **実行タイミング**: 毎週月曜日の午前 1 時（UTC）
- **対象**: `data/weekly/` に登録されているすべてのリポジトリ
- **データ形式**: `{年}-W{週番号}.json` 形式（例: `2025-W26.json`）

### GitHub Actions ワークフロー

`.github/workflows/weekly-data-update.yml` で定義されているワークフローが以下の処理を実行します：

1. **依存関係のインストール**: `npm ci`
2. **Next.js アプリケーションのビルド**: `npm run build`
3. **データ収集スクリプトの実行**: `scripts/update-weekly-data.mjs`
4. **変更の自動コミット**: 新しいデータが追加された場合
5. **エラー通知**: 失敗時に自動で Issue を作成

### 手動実行

#### GitHub Actions での手動実行

1. GitHub リポジトリの「Actions」タブに移動
2. 「Weekly Data Update」ワークフローを選択
3. 「Run workflow」をクリック
4. オプション：
   - `強制更新`: 既存データを上書きする場合はチェック

#### ローカルでの手動実行

```bash
# 通常の更新（既存データがある場合はスキップ）
npm run update-data

# 強制更新（既存データを上書き）
FORCE_UPDATE=true npm run update-data
```

### データ収集プロセス

1. **サーバー起動**: Next.js アプリケーションを本番モードで起動
2. **リポジトリ取得**: `/api/repositories` から登録済みリポジトリ一覧を取得
3. **データ収集**: 各リポジトリについて `/api/collect-data` API を呼び出し
4. **重複チェック**: 既存データがある場合は強制更新フラグを確認
5. **データ保存**: `data/weekly/{owner}/{repo}/{week}.json` に保存
6. **サーバー停止**: データ収集完了後にプロセスを終了

### 監視とトラブルシューティング

#### 成功時のログ

```
🚀 Starting weekly data update process...
Server is ready
Found 3 repositories to update:
  - ***REMOVED***/***REMOVED***
  - randombar164/ouchi_bar
  - tt/tt
✅ Successfully updated ***REMOVED***/***REMOVED***: Successfully collected data for week 2025-W26
⏭️  Skipped (already exists): randombar164/ouchi_bar
✨ Weekly data update completed successfully!
```

#### エラー時の対応

- **ビルドエラー**: `npm run build` で手動ビルドしてエラーを確認
- **API 接続エラー**: GitHub Token や API レート制限を確認
- **データ保存エラー**: ファイルシステムの権限やディスクスペースを確認

#### 自動 Issue 作成

ワークフローが失敗した場合、以下の情報を含む Issue が自動作成されます：

- 実行時刻
- ワークフロー名
- 実行 ID
- ラベル: `bug`, `automation`

### 環境変数

- `GITHUB_TOKEN`: GitHub API 認証トークン（Actions 内で自動設定）
- `FORCE_UPDATE`: 強制更新フラグ（`true`/`false`）
- `NODE_ENV`: 実行環境（通常は`production`）

### セキュリティ

- GitHub トークンは`secrets.GITHUB_TOKEN`を使用
- リポジトリへの書き込み権限のみを付与
- プライベートリポジトリデータのセキュアな処理

### カスタマイズ

#### 実行スケジュールの変更

`.github/workflows/weekly-data-update.yml` の `cron` 式を編集：

```yaml
schedule:
  # 毎週水曜日の午後3時（UTC）に変更する場合
  - cron: "0 15 * * 3"
```

#### 対象リポジトリの追加

新しいリポジトリのデータを `data/weekly/{owner}/{repo}/` ディレクトリに追加すると、自動的に更新対象になります。
