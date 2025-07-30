import Search from "./Search";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <>
      <div className="p-3 bg-gray-900">
        <div className="flex justify-between items-center mb-1">
          <p
            onClick={() => navigate("/")}
            className="p-2 text-4xl font-light text-gray-200 tracking-wider"
          >
            bookify
          </p>
          <a
            href="/Sign Up"
            className="bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-lg px-4 py-2 flex items-center justify-center font-semibold text-gray-900 hover:from-yellow-400 hover:to-yellow-500 hover:border-1 hover:border-gray-700"
          >
            Sign up
          </a>
        </div>
        <div className="flex w-full justify-center items-center">
          <Search />
        </div>
      </div>
    </>
  );
}
