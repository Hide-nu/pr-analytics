import { NextRequest, NextResponse } from "next/server";
import { octokit } from "@/lib/github";
import { DataStorage } from "@/lib/dataStorage";
import {
  collectWeeklyData,
  checkExistingData,
  saveWeeklyData,
} from "./_libs/dataCollector";
import {
  CollectDataRequest,
  CollectDataResponse,
  AvailableWeeksResponse,
} from "./_libs/types";

const dataStorage = new DataStorage();

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, week }: CollectDataRequest = await request.json();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const targetWeek = week || dataStorage.getCurrentWeek();
    console.log(`Collecting data for ${owner}/${repo} week ${targetWeek}`);

    // 既存データがあるかチェック
    const existingData = await checkExistingData(
      dataStorage,
      owner,
      repo,
      targetWeek
    );
    if (existingData) {
      return NextResponse.json({
        message: `Data for week ${targetWeek} already exists`,
        week: targetWeek,
        data: existingData,
      });
    }

    // データ収集
    const collectionResult = await collectWeeklyData(
      octokit,
      owner,
      repo,
      targetWeek
    );

    // データを保存
    const weeklyData = await saveWeeklyData(
      dataStorage,
      owner,
      repo,
      targetWeek,
      collectionResult.prDetails
    );

    const response: CollectDataResponse = {
      message: `Successfully collected data for week ${targetWeek}`,
      week: targetWeek,
      prCount: collectionResult.processedCount,
      data: weeklyData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error collecting data:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 利用可能な週データの一覧を取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  try {
    const availableWeeks = await dataStorage.getAvailableWeeks(owner, repo);
    const lastCollectedWeek = await dataStorage.getLastCollectedWeek(
      owner,
      repo
    );
    const currentWeek = dataStorage.getCurrentWeek();
    const recentWeeks = dataStorage.getRecentWeeks(52);

    const response: AvailableWeeksResponse = {
      owner,
      repo,
      currentWeek,
      lastCollectedWeek,
      availableWeeks,
      recentWeeks,
      totalWeeks: availableWeeks.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
