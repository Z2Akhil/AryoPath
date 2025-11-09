import React from "react";
import SkeletonText from "../SkeletonText";

const SkeletonPackageCard = () => {
  return (
    <div className="w-full sm:max-w-sm bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Image Section - Fixed Height */}
      <div className="relative h-48 sm:h-52 shrink-0 bg-gray-200 animate-pulse">
        {/* Category badge */}
        <div className="absolute top-2 right-2">
          <SkeletonText width="3rem" height="1.25rem" rounded="rounded" />
        </div>
        
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
          <SkeletonText width="80%" height="1rem" />
        </div>
      </div>

      {/* Content Section - Flexible */}
      <div className="p-3 sm:p-4 flex flex-col grow">
        {/* Title */}
        <div className="mb-2">
          <SkeletonText width="90%" height="1.25rem" />
        </div>

        {/* Short info */}
        <div className="flex items-center justify-between bg-gray-100 rounded-full py-2 px-3 sm:px-4 mb-3">
          <SkeletonText width="4rem" height="0.875rem" />
          <SkeletonText width="5rem" height="0.875rem" />
        </div>

        {/* Sample & Fasting Info */}
        <div className="flex justify-between text-xs sm:text-sm mb-3">
          <div className="flex flex-col gap-1">
            <SkeletonText width="6rem" height="0.75rem" />
            <SkeletonText width="4rem" height="0.75rem" />
          </div>
          <div className="flex flex-col gap-1">
            <SkeletonText width="6rem" height="0.75rem" />
            <SkeletonText width="4rem" height="0.75rem" />
          </div>
        </div>

        {/* Price Section */}
        <div className="min-h-[50px] flex items-center mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SkeletonText width="4rem" height="1.5rem" />
            <SkeletonText width="5rem" height="2rem" />
            <SkeletonText width="3rem" height="1.5rem" />
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex gap-2 mb-3">
          <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
          <SkeletonText width="100%" height="2.5rem" rounded="rounded-md" />
        </div>

        {/* Footer */}
        <div className="border-t pt-3 mt-auto">
          <div className="space-y-2">
            <SkeletonText width="100%" height="0.75rem" />
            <SkeletonText width="90%" height="0.75rem" />
            <SkeletonText width="80%" height="0.75rem" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonPackageCard;
