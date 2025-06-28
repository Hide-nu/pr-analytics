import React from "react";

interface UserExcludeSettingsProps {
  allUsers: string[];
  excludedUsers: string[];
  showUserExcludeSettings: boolean;
  onToggleSettings: () => void;
  onToggleUserExclusion: (user: string) => void;
}

const UserExcludeSettings: React.FC<UserExcludeSettingsProps> = ({
  allUsers,
  excludedUsers,
  showUserExcludeSettings,
  onToggleSettings,
  onToggleUserExclusion,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          ⚙️ ユーザー除外設定
        </h2>
        <button
          onClick={onToggleSettings}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          {showUserExcludeSettings ? "設定を隠す" : "設定を表示"}
        </button>
      </div>

      {showUserExcludeSettings && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            集計から除外するユーザーを選択してください（github-actions[bot]、dependabot[bot]などのボットアカウント含む）
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allUsers.map((user) => (
              <label
                key={user}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={excludedUsers.includes(user)}
                  onChange={() => onToggleUserExclusion(user)}
                  className="rounded"
                />
                <span
                  className={`text-sm ${
                    excludedUsers.includes(user)
                      ? "line-through text-gray-500"
                      : ""
                  }`}
                >
                  {user}
                </span>
              </label>
            ))}
          </div>
          {excludedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                除外中のユーザー: {excludedUsers.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserExcludeSettings;
