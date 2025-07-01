"use client";

import React, { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";
import { saveSelectedRepository, getSelectedRepository } from "@/lib/cookies";

interface Repository {
  owner: string;
  repo: string;
}

const Home: React.FC = () => {
  const [availableRepositories, setAvailableRepositories] = useState<
    Repository[]
  >([]);
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // コンポーネントマウント時にリポジトリ一覧とCookieから選択状態を取得
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        // リポジトリ一覧を取得
        const response = await fetch("/api/repositories");
        const data = await response.json();
        const repositories = data.repositories || [];
        setAvailableRepositories(repositories);

        // Cookieから前回選択されたリポジトリを取得
        const savedRepository = getSelectedRepository();
        if (
          savedRepository &&
          repositories.some(
            (repo: Repository) =>
              repo.owner === savedRepository.owner &&
              repo.repo === savedRepository.repo
          )
        ) {
          setSelectedRepository(savedRepository);
        }
      } catch (error) {
        console.error("Failed to fetch repositories:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleRepositorySelect = (repository: Repository | null) => {
    setDataLoading(true);

    if (repository) {
      setSelectedRepository(repository);
      saveSelectedRepository(repository);
    } else {
      setSelectedRepository(null);
    }

    // データ読み込み状態を少し表示してからクリア
    setTimeout(() => setDataLoading(false), 500);
  };

  // 初期ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          selectedRepository={null}
          availableRepositories={[]}
          onRepositorySelect={() => {}}
          loading={true}
        />
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            アプリケーションを初期化中...
          </div>
        </div>
      </div>
    );
  }

  // リポジトリが登録されていない場合
  if (availableRepositories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header
          selectedRepository={null}
          availableRepositories={[]}
          onRepositorySelect={() => {}}
        />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                PR Analytics へようこそ
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                GitHubリポジトリのPull
                Requestを分析して、チームの開発効率を可視化します。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  🚀 はじめに
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-left">
                  現在、分析対象のリポジトリが登録されていません。
                  <br />
                  管理者にお問い合わせいただき、分析したいリポジトリを登録してもらってください。
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 機能紹介
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
                  <li>• PR数、マージ時間、レビュー数の週次推移分析</li>
                  <li>• チームメンバーのパフォーマンス比較</li>
                  <li>• サイクルタイムの詳細分解とボトルネック特定</li>
                  <li>• 手戻り率（Code Churn）の可視化</li>
                  <li>• ラベル分類による技術的負債の追跡</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        selectedRepository={selectedRepository}
        availableRepositories={availableRepositories}
        onRepositorySelect={handleRepositorySelect}
        loading={dataLoading}
      />

      {selectedRepository ? (
        <Dashboard
          owner={selectedRepository.owner}
          repo={selectedRepository.repo}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                リポジトリを選択してください
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                上部のヘッダーからリポジトリを選択して分析を開始できます。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                利用可能なリポジトリ
              </h2>
              <div className="grid gap-3">
                {availableRepositories.map((repository) => (
                  <button
                    key={`${repository.owner}/${repository.repo}`}
                    onClick={() => handleRepositorySelect(repository)}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {repository.owner}/{repository.repo}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      分析開始 →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
