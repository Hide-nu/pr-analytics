"use client";

import React from "react";

interface Repository {
  owner: string;
  repo: string;
}

interface HeaderProps {
  selectedRepository: Repository | null;
  availableRepositories: Repository[];
  onRepositorySelect: (repository: Repository | null) => void;
  loading?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  selectedRepository,
  availableRepositories,
  onRepositorySelect,
  loading = false,
}) => {
  const handleRepositoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const [owner, repo] = selectedValue.split("/");
      onRepositorySelect({ owner, repo });
    } else {
      onRepositorySelect(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* ロゴ・タイトル */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            📊 PR Analytics
          </h1>
          {selectedRepository && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              / {selectedRepository.owner}/{selectedRepository.repo}
            </div>
          )}
        </div>

        {/* リポジトリ選択 */}
        <div className="flex items-center gap-4">
          <div className="min-w-64">
            <select
              value={
                selectedRepository
                  ? `${selectedRepository.owner}/${selectedRepository.repo}`
                  : ""
              }
              onChange={handleRepositoryChange}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">リポジトリを選択...</option>
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

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              読み込み中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
