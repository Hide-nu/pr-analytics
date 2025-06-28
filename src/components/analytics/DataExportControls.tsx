import React from "react";

interface DataExportControlsProps {
  repositoryOwner: string;
  repositoryName: string;
}

const DataExportControls: React.FC<DataExportControlsProps> = ({
  repositoryOwner,
  repositoryName,
}) => {
  const handleExport = (format: "json" | "csv") => {
    window.open(
      `/api/export?owner=${repositoryOwner}&repo=${repositoryName}&format=${format}`,
      "_blank"
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📥 データエクスポート
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        蓄積された週次PRデータをJSON形式またはCSV形式でダウンロードできます。
      </p>
      <div className="flex space-x-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          onClick={() => handleExport("json")}
        >
          JSONをエクスポート
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => handleExport("csv")}
        >
          CSVをエクスポート
        </button>
      </div>
    </div>
  );
};

export default DataExportControls;
