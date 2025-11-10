import SkeletonText from "../SkeletonText";

const SkeletonPackageDetailed = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex mb-8">
          <div className="flex items-center space-x-2">
            <SkeletonText width="3rem" height="1rem" />
            <SkeletonText width="1rem" height="1rem" />
            <SkeletonText width="4rem" height="1rem" />
            <SkeletonText width="1rem" height="1rem" />
            <SkeletonText width="8rem" height="1rem" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Package Details Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card Skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              {/* Header Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex-1">
                  <SkeletonText width="80%" height="2.5rem" className="mb-2" />
                  <div className="flex items-center gap-4">
                    <SkeletonText width="8rem" height="1rem" />
                    <SkeletonText width="6rem" height="1rem" />
                  </div>
                </div>
                <SkeletonText width="5rem" height="2.5rem" rounded="rounded-lg" />
              </div>

              {/* Price Section Skeleton */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-baseline gap-3 mb-4 sm:mb-0">
                    <SkeletonText width="6rem" height="3rem" />
                    <div className="flex items-center gap-2">
                      <SkeletonText width="4rem" height="1.5rem" />
                      <SkeletonText width="4rem" height="1.5rem" />
                    </div>
                  </div>
                  <SkeletonText width="6rem" height="1rem" />
                </div>
              </div>

              {/* Fasting Info Skeleton */}
              <div className="border-l-4 border-gray-200 bg-gray-50 rounded-r-lg p-5 mb-6">
                <div className="flex items-start gap-3">
                  <SkeletonText width="1.5rem" height="1.5rem" rounded="rounded-full" />
                  <div className="flex-1">
                    <SkeletonText width="12rem" height="1.25rem" className="mb-1" />
                    <SkeletonText width="100%" height="1rem" className="mb-1" />
                    <SkeletonText width="90%" height="1rem" />
                  </div>
                </div>
              </div>

              {/* Included Tests Skeleton */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <SkeletonText width="12rem" height="1.75rem" />
                  <SkeletonText width="8rem" height="1rem" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <SkeletonText width="8rem" height="1.25rem" />
                          <SkeletonText width="3rem" height="1.25rem" />
                        </div>
                        <SkeletonText width="1.25rem" height="1.25rem" rounded="rounded-full" />
                      </div>
                      <div className="border-t border-gray-100 px-6 py-4">
                        <div className="space-y-2">
                          {Array.from({ length: 4 }).map((_, testIndex) => (
                            <div key={testIndex} className="flex items-center gap-3">
                              <SkeletonText width="0.5rem" height="0.5rem" rounded="rounded-full" />
                              <SkeletonText width="15rem" height="1rem" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Form Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 sticky top-8">
              <div className="p-6">
                <SkeletonText width="10rem" height="1.5rem" className="mb-4" />
                <div className="space-y-3">
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                  <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Book With Us Section Skeleton */}
      <div className="max-w-6xl mx-auto mt-16 px-6">
        <div className="text-center mb-16">
          <SkeletonText width="12rem" height="2rem" className="mx-auto mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <SkeletonText width="2.5rem" height="2.5rem" rounded="rounded-full" className="mb-3" />
                <SkeletonText width="8rem" height="1rem" />
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section Skeleton */}
        <div className="text-center">
          <SkeletonText width="10rem" height="2rem" className="mx-auto mb-10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <SkeletonText width="2.5rem" height="2.5rem" rounded="rounded-full" className="mb-3" />
                <SkeletonText width="6rem" height="1.25rem" className="mb-1" />
                <SkeletonText width="15rem" height="1rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPackageDetailed;
