export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Book Header Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Book Cover Skeleton */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-48 md:w-56">
              <div className="bg-white rounded-xl shadow-lg p-3">
                <div className="bg-gray-200 rounded-lg aspect-[2/3] w-full"></div>
              </div>
            </div>
          </div>

          {/* Book Details Skeleton */}
          <div className="flex-1 space-y-5">
            {/* Title */}
            <div className="h-9 bg-gray-200 rounded-lg w-3/4"></div>

            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>

            {/* Description Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About the Author Section */}
      <div className="container mx-auto px-4 mt-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
            {/* Author Photo */}
            <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
              <div className="w-24 sm:w-28 aspect-square bg-gray-200 rounded-lg"></div>
              <div className="mt-3 space-y-2 w-full">
                <div className="h-5 bg-gray-200 rounded w-24 mx-auto sm:mx-0"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mx-auto sm:mx-0"></div>
              </div>
            </div>
            {/* Author Bio */}
            <div className="flex-1">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 h-full">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto px-4 mt-10 mb-10 max-w-6xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Review Form Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="h-24 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-28"></div>
        </div>

        {/* Review Items */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="w-4 h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
