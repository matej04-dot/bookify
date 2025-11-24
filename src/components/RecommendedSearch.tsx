"use client";

import type { FC } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface RecommendedSearchProps {
  recommendations: string[];
  onSelect: (value: string) => void;
  visible: boolean;
}

const RecommendedSearch: FC<RecommendedSearchProps> = ({
  recommendations,
  onSelect,
  visible,
}) => {
  const router = useRouter();

  if (!visible || recommendations.length === 0) return null;

  const handleSelect = (rec: string) => {
    onSelect(rec);
    const formatted = rec.trim().toLocaleLowerCase().replace(/\s+/g, "+");
    router.push(`/search?q=${formatted}&mode=everything`);
  };

  return (
    <div
      className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ zIndex: 20 }}
    >
      <div className="max-h-80 overflow-y-auto">
        {recommendations.map((rec, index) => (
          <div
            key={`${rec}-${index}`}
            className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 group"
            onClick={() => handleSelect(rec)}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors mr-3">
              <FaSearch className="text-blue-600 text-sm" />
            </div>
            <span className="text-gray-700 font-medium group-hover:text-blue-700 transition-colors">
              {rec}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedSearch;
