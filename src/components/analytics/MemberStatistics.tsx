import React from "react";
import { AnalyticsData } from "@/types/analytics";

interface MemberStatisticsProps {
  data: AnalyticsData;
  onMemberSelect: (user: string | null) => void;
  selectedMember: string | null;
}

const MemberStatistics: React.FC<MemberStatisticsProps> = ({
  data,
  onMemberSelect,
  selectedMember,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        👥 Metrics by Member
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b dark:border-gray-600">
              <th className="text-left py-3">Member</th>
              <th className="text-right py-3">Total PRs</th>
              <th className="text-right py-3">Merged</th>
              <th className="text-right py-3">Open</th>
              <th className="text-right py-3">Avg Changes</th>
              <th className="text-right py-3">Avg Merge Time (h)</th>
              <th className="text-right py-3">Comments</th>
              <th className="text-right py-3">Avg Commits</th>
            </tr>
          </thead>
          <tbody>
            {data.memberStats.map((member) => (
              <tr
                key={member.user}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() =>
                  onMemberSelect(
                    selectedMember === member.user ? null : member.user
                  )
                }
              >
                <td className="py-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src={member.avatar_url}
                      alt={member.user}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium">{member.user}</span>
                  </div>
                </td>
                <td className="text-right py-3">{member.totalPRs}</td>
                <td className="text-right py-3">{member.mergedPRs}</td>
                <td className="text-right py-3">{member.openPRs}</td>
                <td className="text-right py-3">
                  {member.avgChanges.toFixed(0)}
                </td>
                <td className="text-right py-3">
                  {member.avgMergeTime.toFixed(1)}
                </td>
                <td className="text-right py-3">{member.totalComments}</td>
                <td className="text-right py-3">
                  {member.avgCommits.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberStatistics;
