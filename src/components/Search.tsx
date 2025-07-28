export default function Search() {
  return (
    <>
      <input
        type="text"
        placeholder="Search books..."
        className="w-xl bg-gray-100 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 flex-grow"
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-r-lg px-5 py-2 flex items-center justify-center font-semibold text-gray-900 hover:from-yellow-400 hover:to-yellow-500 hover:border-1 hover:border-gray-700"
      >
        Search
      </button>
    </>
  );
}
