import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import RecommendedSearch from "./RecommendedSearch";
import { baseUrl } from "@/utils/Constants";

const fetchBookTitles = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];

  const url = `${baseUrl}/search.json?q=${encodeURIComponent(
    query
  )}&mode=everything&limit=5`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`);
  }

  const data = await res.json();
  return data.docs.map((book: { title: string }) => book.title);
};

export default function Search() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendVisible, setRecommendVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.trim().length > 0) {
      const results = await fetchBookTitles(
        newValue.trim().replace(/\s+/g, "+")
      );
      setRecommendations(results);
      setRecommendVisible(true);
    } else {
      setRecommendations([]);
      setRecommendVisible(false);
    }
  };

  const handleClick = useCallback(() => {
    const formatted = value.trim().replace(/\s+/g, "+");
    const searchKey = `/search?q=${formatted}&mode=everything`;
    setRecommendVisible(false);
    navigate(`${searchKey}`);
  }, [navigate, value]);

  const handleSelectRecommendation = (rec: string) => {
    setValue(rec);
    setRecommendVisible(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setValue("");
        setRecommendVisible(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex w-full">
        <input
          type="text"
          value={value}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleClick();
            }
          }}
          onChange={handleChange}
          placeholder="Search books..."
          className="bg-gray-100 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-1 border border-gray-300 focus:border-1 focus:border-yellow-400 flex-grow"
        />
        <button
          type="submit"
          onClick={handleClick}
          className="bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-r-lg px-5 py-2 flex items-center justify-center font-semibold text-gray-900 hover:from-yellow-400 hover:to-yellow-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>
      <RecommendedSearch
        recommendations={recommendations}
        onSelect={handleSelectRecommendation}
        visible={recommendVisible}
      />
    </div>
  );
}
