# GitHub Actions ワークフロー

このディレクトリには、PR Analytics プロジェクトで使用される GitHub Actions ワークフローファイルが含まれています。

## ワークフロー一覧

### 1. `weekly-data-update.yml` - 週次データ自動更新

**実行タイミング**: 毎週月曜日 01:00 UTC（日本時間：月曜日 10:00）

**機能**:

- 登録済みリポジトリの週次 PR データを自動収集
- 新しいデータを`data/weekly/`ディレクトリに保存
- 変更を自動でコミット・プッシュ
- エラー時に自動で Issue を作成

**手動実行**:

- GitHub 上で「Actions」→「Weekly Data Update」→「Run workflow」
- 強制更新オプション有り

### 2. `test-data-update.yml` - データ更新テスト

**実行タイミング**: 手動実行のみ

**機能**:

- データ更新スクリプトの動作確認
- ドライランモードでのテスト実行
- 特定リポジトリのみのテスト

**使用方法**:

```bash
# GitHub Actions画面で手動実行
# オプション:
# - ドライラン: true/false
# - テスト対象リポジトリ: owner/repo (オプション)
```

## 権限設定

各ワークフローに必要な権限:

### 週次データ更新

```yaml
permissions:
  contents: write # ファイル変更とコミット用
```

### テスト実行

```yaml
permissions:
  contents: read # ファイル読み取り用
```

## セキュリティ

- `GITHUB_TOKEN`は自動設定される秘密トークンを使用
- プライベートリポジトリへのアクセスは制限
- 書き込み権限は必要最小限に制限

## トラブルシューティング

### よくある問題

1. **ビルドエラー**

   - `npm ci`でパッケージ依存関係を確認
   - TypeScript エラーがないか確認

2. **API 接続エラー**

   - GitHub API のレート制限を確認
   - トークンの権限を確認

3. **データ保存エラー**
   - ファイル権限を確認
   - ディスクスペースを確認

### ログの確認方法

1. GitHub リポジトリの「Actions」タブに移動
2. 該当ワークフローの実行履歴をクリック
3. 各ステップのログを展開して詳細を確認

### デバッグモード

テストワークフローを使用してデバッグ:

```yaml
# ドライランモードでテスト
dry_run: true
target_repo: "specific/repository" # 特定のリポジトリのみテスト
```

## カスタマイズ

### スケジュール変更

`weekly-data-update.yml`の`cron`式を編集:

```yaml
schedule:
  # 毎日午前2時に実行する場合
  - cron: "0 2 * * *"

  # 毎週金曜日午後6時に実行する場合
  - cron: "0 18 * * 5"
```

### 通知設定

エラー時の通知を Slack やメールに変更:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 監視

### 成功指標

- ワークフローが正常完了
- 新しい JSON ファイルがコミットされている
- エラー Issue が作成されていない

### 失敗時の対応

1. 自動作成された Issue を確認
2. ワークフローログでエラー詳細を確認
3. 必要に応じて手動でデータ更新を実行
4. 根本的な問題を修正してから再実行
