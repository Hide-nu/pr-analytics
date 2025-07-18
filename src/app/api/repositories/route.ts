import { NextResponse } from "next/server";
import { DataStorage } from "@/lib/dataStorage";
import { promises as fs } from "fs";
import path from "path";
import { isRestrictedEnvironment } from "@/lib/environment";

interface Repository {
  owner: string;
  repo: string;
}

interface RepositoriesConfig {
  default: Repository[];
  metadata: {
    version: string;
    description: string;
    lastUpdated: string;
    maintainer: string;
  };
  validation: {
    requiredFields: string[];
    maxRepositories: number;
  };
}

export async function GET() {
  try {
    const dataStorage = new DataStorage();
    const repositories = await dataStorage.getAvailableRepositories();

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // 制限環境ではリポジトリ追加を無効化
  if (isRestrictedEnvironment()) {
    return NextResponse.json(
      {
        error:
          "リポジトリの追加は本番環境では利用できません。ローカル環境で設定ファイルを更新してください。",
        suggestion:
          "config/repositories.json を直接編集してデプロイしてください",
      },
      { status: 403 }
    );
  }

  try {
    const { owner, repo }: Repository = await request.json();

    // バリデーション
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner と repo は必須項目です" },
        { status: 400 }
      );
    }

    // 設定ファイルのパス
    const configPath = path.join(process.cwd(), "config", "repositories.json");

    // 現在の設定を読み込み
    let config: RepositoriesConfig;
    try {
      const configData = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(configData);
    } catch {
      // ファイルが存在しない場合はデフォルト設定を作成
      config = {
        default: [],
        metadata: {
          version: "1.0.0",
          description: "PR Analytics対象リポジトリ設定",
          lastUpdated: new Date().toISOString(),
          maintainer: "SRE Team",
        },
        validation: {
          requiredFields: ["owner", "repo"],
          maxRepositories: 10,
        },
      };
    }

    // 重複チェック
    const isDuplicate = config.default.some(
      (existing) => existing.owner === owner && existing.repo === repo
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: "このリポジトリは既に登録されています" },
        { status: 409 }
      );
    }

    // 最大リポジトリ数チェック
    if (config.default.length >= config.validation.maxRepositories) {
      return NextResponse.json(
        {
          error: `最大登録可能数（${config.validation.maxRepositories}）に達しています`,
        },
        { status: 400 }
      );
    }

    // 新しいリポジトリを追加
    config.default.push({ owner, repo });
    config.metadata.lastUpdated = new Date().toISOString();

    // 設定ファイルを更新
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json({
      message: "リポジトリが正常に追加されました",
      repository: { owner, repo },
    });
  } catch (error) {
    console.error("Error adding repository:", error);
    return NextResponse.json(
      { error: "リポジトリの追加に失敗しました" },
      { status: 500 }
    );
  }
}
