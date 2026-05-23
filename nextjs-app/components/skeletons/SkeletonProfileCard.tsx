const SkeletonProfileCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
    {/* Image */}
    <div className="h-40 sm:h-44 bg-gray-200 animate-pulse shrink-0" />
    {/* Content */}
    <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 animate-pulse">
      {/* Stats row */}
      <div className="h-8 w-full bg-gray-100 rounded-xl" />
      {/* Price */}
      <div className="h-6 w-20 bg-gray-200 rounded" />
      {/* Buttons */}
      <div className="flex gap-2 mt-auto">
        <div className="w-10 h-10 bg-gray-200 rounded-xl sm:hidden" />
        <div className="hidden sm:block flex-1 h-10 bg-gray-200 rounded-xl" />
        <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  </div>
);

export default SkeletonProfileCard;
