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
      className="absolute left-0 right-0 mt-1.5 bg-white rounded-lg shadow-lg border border-t-0 border-gray-200"
      style={{ zIndex: 20 }}
    >
      <div className="max-h-72 overflow-y-auto">
        {recommendations.map((rec, index) => (
          <div
            key={`${rec}-${index}`}
            className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-500 hover:rounded-lg"
            onClick={() => handleSelect(rec)}
          >
            <FaSearch className="mr-2" />
            <span className="text-gray-600">{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedSearch;
