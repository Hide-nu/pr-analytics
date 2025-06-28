"use client";

import React, { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";

interface Repository {
  owner: string;
  repo: string;
}

const Home: React.FC = () => {
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [availableRepositories, setAvailableRepositories] = useState<
    Repository[]
  >([]);
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // コンポーネントマウント時にリポジトリ一覧を取得
  useEffect(() => {
    fetchAvailableRepositories();
  }, []);

  const fetchAvailableRepositories = async () => {
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();
      setAvailableRepositories(data.repositories || []);
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (owner.trim() && repo.trim()) {
      const newRepo = { owner: owner.trim(), repo: repo.trim() };
      setSelectedRepository(newRepo);
      setShowAddForm(false);
      // リポジトリ一覧を更新
      fetchAvailableRepositories();
    }
  };

  const handleRepositorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const [owner, repo] = selectedValue.split("/");
      setSelectedRepository({ owner, repo });
    } else {
      setSelectedRepository(null);
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
    setOwner("");
    setRepo("");
  };

  const handleCancelAddForm = () => {
    setShowAddForm(false);
    setOwner("");
    setRepo("");
  };

  const handleResetDashboard = () => {
    setSelectedRepository(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-8">
        {!selectedRepository && !showAddForm && (
          <div>
            {/* ヘッダー */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                GitHub Team Performance Analyzer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                GitHubリポジトリのPRとIssueを分析して、チームのパフォーマンスを可視化します。
              </p>
            </div>

            {/* リポジトリ選択エリア */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      リポジトリを選択:
                    </label>
                    <select
                      onChange={handleRepositorySelect}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      defaultValue=""
                    >
                      <option value="">リポジトリを選択してください</option>
                      {availableRepositories.map((repository) => (
                        <option
                          key={`${repository.owner}/${repository.repo}`}
                          value={`${repository.owner}/${repository.repo}`}
                        >
                          {repository.owner}/{repository.repo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 sm:invisible">
                      アクション
                    </label>
                    <button
                      onClick={handleShowAddForm}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
                    >
                      リポジトリ追加
                    </button>
                  </div>
                </div>

                {availableRepositories.length === 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      まだリポジトリが登録されていません。「リポジトリ追加」ボタンから新しいリポジトリを追加してください。
                    </p>
                  </div>
                )}
              </div>

              {availableRepositories.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>注意:</strong>{" "}
                    GitHubトークンが必要です。.env.localファイルにGITHUB_TOKENを設定してください。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                新しいリポジトリを追加
              </h2>
              <button
                onClick={handleCancelAddForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  オーナー名:
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例: microsoft"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  リポジトリ名:
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例: vscode"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelAddForm}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  追加して分析開始
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>注意:</strong>{" "}
                GitHubトークンが必要です。.env.localファイルにGITHUB_TOKENを設定してください。
              </p>
            </div>
          </div>
        )}

        {selectedRepository && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResetDashboard}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← リポジトリ選択に戻る
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedRepository.owner}/{selectedRepository.repo}
                </h2>
              </div>
            </div>
            <Dashboard
              owner={selectedRepository.owner}
              repo={selectedRepository.repo}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
