import React from "react";
import SkeletonText from "../SkeletonText";

const SkeletonOfferCard = () => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between">
      {/* Package Name */}
      <div className="mb-2">
        <SkeletonText width="80%" height="1.25rem" className="mb-1" />
      </div>

      {/* Test List */}
      <div className="mb-6">
        <SkeletonText width="100%" height="0.875rem" className="mb-1" />
        <SkeletonText width="60%" height="0.875rem" />
      </div>

      {/* Price + Book Section */}
      <div className="flex items-center justify-between mt-auto">
        {/* Left side: Price & discount */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-2">
            <SkeletonText width="4rem" height="1.5rem" />
            <SkeletonText width="3rem" height="0.875rem" />
          </div>
          <SkeletonText width="3.5rem" height="1.5rem" />
        </div>

        {/* Right side: Book button */}
        <SkeletonText width="5rem" height="2.5rem" rounded="rounded-md" />
      </div>
    </div>
  );
};

export default SkeletonOfferCard;
