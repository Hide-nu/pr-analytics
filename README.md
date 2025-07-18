# PR Analytics - チーム開発効率可視化ダッシュボード

GitHub リポジトリの Pull Request を分析して、チームの開発効率とボトルネックを可視化するダッシュボードです。

## 機能

- 📊 **週次 PR 分析**: PR 数、マージ時間、レビュー数の推移を可視化
- 👥 **チームメンバー比較**: メンバー別のパフォーマンス分析
- ⏱️ **サイクルタイム分析**: 開発からマージまでの時間分解
- 🔄 **手戻り率分析**: Code Churn による品質指標
- 🏷️ **ラベル分析**: 技術的負債やタスク分類の追跡
- 📈 **トレンド分析**: 期間比較による改善傾向の把握

## セットアップ

### 前提条件

- Node.js 18 以上
- npm または yarn
- GitHub Personal Access Token

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd pr-analytics
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成し、GitHub Personal Access Token を設定：

```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

### 4. リポジトリ設定

`config/repositories.json`を編集して分析対象のリポジトリを追加：

```json
{
  "default": [
    {
      "owner": "your-username",
      "repo": "your-repository"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "description": "PR Analytics対象リポジトリ設定",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "maintainer": "Your Team"
  },
  "validation": {
    "requiredFields": ["owner", "repo"],
    "maxRepositories": 10
  }
}
```

### 5. データ収集

ローカル環境でデータを収集：

```bash
# 最新の週のデータを収集
npm run update-data

# 強制的に全データを再収集
npm run update-data:force
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## デプロイ

### Vercel へのデプロイ

⚠️ **重要な注意事項**: Vercel はサーバーレス環境のため、以下の制限があります：

1. **ファイルシステム書き込み不可**: 実行時にデータファイルを作成・更新できません
2. **データ収集機能無効**: 本番環境ではデータ収集 API が無効化されます
3. **静的データのみ**: デプロイ時に含まれるデータのみが利用可能です

#### デプロイ手順

1. **ローカルでデータ収集**:

   ```bash
   npm run update-data
   ```

2. **Vercel にデプロイ**:

   ```bash
   vercel --prod
   ```

3. **環境変数の設定**:
   Vercel のダッシュボードで`GITHUB_TOKEN`を設定

#### トラブルシューティング

**404 エラーが発生する場合**:

- データファイルが存在することを確認
- `data/weekly/`ディレクトリに JSON ファイルがあることを確認
- リポジトリ設定が正しいことを確認

**データが表示されない場合**:

- ローカルでデータ収集を実行してからデプロイ
- GitHub Token の権限を確認
- リポジトリのアクセス権限を確認

### その他のプラットフォーム

Docker、Railway、Render 等のプラットフォームでも同様の制限があります。データ収集はローカル環境で行い、静的ファイルとしてデプロイしてください。

## 使用方法

### 1. リポジトリ選択

ヘッダーから分析対象のリポジトリを選択します。

### 2. 期間設定

日付範囲セレクターで分析期間を設定できます。

### 3. 比較分析

期間比較機能で改善傾向を確認できます。

### 4. データエクスポート

CSV/JSON 形式でデータをエクスポートできます。

## 開発

### テスト

```bash
# 単体テスト
npm run test

# テストUI
npm run test:ui

# テスト実行
npm run test:run
```

### ローカルテスト

```bash
# ローカル環境でのテスト
npm run test:local

# ドライラン（実際のAPI呼び出しなし）
npm run test:local:dry
```

### デバッグ

```bash
# デバッグサーバー起動
npm run debug:server
```

## アーキテクチャ

### フロントエンド

- **Next.js 15**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Chart.js**: グラフ描画
- **SWR**: データフェッチング

### バックエンド

- **Next.js API Routes**: サーバーサイド API
- **Octokit**: GitHub API クライアント
- **date-fns**: 日付処理

### データ管理

- **ファイルシステム**: 週次データの保存
- **JSON**: 設定とデータの形式
- **Cookie**: ユーザー設定の保存

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題が発生した場合は、以下の手順でトラブルシューティングしてください：

1. ローカル環境で動作確認
2. データファイルの存在確認
3. GitHub Token の権限確認
4. リポジトリ設定の確認
