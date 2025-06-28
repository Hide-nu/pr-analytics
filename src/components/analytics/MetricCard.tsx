import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  comparisonValue?: string | number;
  showComparison?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  comparisonValue,
  showComparison = false,
}) => {
  const calculateChange = () => {
    if (!showComparison || comparisonValue === undefined) return null;

    const current =
      typeof value === "string"
        ? parseFloat(value.replace(/[^\d.-]/g, ""))
        : value;
    const comparison =
      typeof comparisonValue === "string"
        ? parseFloat(comparisonValue.toString().replace(/[^\d.-]/g, ""))
        : comparisonValue;

    if (isNaN(current) || isNaN(comparison) || comparison === 0) return null;

    const change = ((current - comparison) / comparison) * 100;
    return change;
  };

  const change = calculateChange();

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {showComparison && comparisonValue !== undefined && (
        <div className="mt-2 text-sm">
          <p className="text-gray-500">
            比較: <span className="font-medium">{comparisonValue}</span>
          </p>
          {change !== null && (
            <p
              className={`font-medium ${
                change > 0
                  ? "text-green-600"
                  : change < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
