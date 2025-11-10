import React from "react";
import SkeletonText from "../SkeletonText";

const SkeletonTestCard = () => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between">
      {/* Header: Test Name & Category */}
      <div className="mb-3">
        <SkeletonText width="80%" height="1.25rem" className="mb-1" />
        <SkeletonText width="60%" height="0.875rem" />
      </div>

      {/* Specimen / Units / Fasting Info */}
      <div className="text-sm mb-4 space-y-2">
        <div className="flex justify-between">
          <SkeletonText width="6rem" height="0.875rem" />
          <SkeletonText width="4rem" height="0.875rem" />
        </div>
        <div className="flex justify-between">
          <SkeletonText width="6rem" height="0.875rem" />
          <SkeletonText width="4rem" height="0.875rem" />
        </div>
        <div className="flex justify-between">
          <SkeletonText width="6rem" height="0.875rem" />
          <SkeletonText width="4rem" height="0.875rem" />
        </div>
      </div>

      {/* Price & Discount */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3 flex-wrap">
            <SkeletonText width="4rem" height="1.5rem" />
            <SkeletonText width="5rem" height="2rem" />
            <SkeletonText width="3rem" height="1.5rem" />
          </div>
        </div>

        {/* Add to Cart Button */}
        <SkeletonText width="5rem" height="2.5rem" rounded="rounded-md" />
      </div>

      {/* Footer: Booked Count */}
      <SkeletonText width="8rem" height="0.75rem" />
    </div>
  );
};

export default SkeletonTestCard;
