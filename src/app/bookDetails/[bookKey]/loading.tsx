export default function Loading() {
  return (
    <div className="container mx-auto p-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slika knjige */}
        <div className="md:col-span-1">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[2/3] w-full max-w-sm"></div>
        </div>

        {/* Detalji knjige */}
        <div className="md:col-span-2 space-y-4">
          {/* Naslov */}
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

          {/* Autori */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>

          {/* Rating */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

          {/* Opis */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>

          {/* Dugmad */}
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Reviews sekcija */}
      <div className="mt-8 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
