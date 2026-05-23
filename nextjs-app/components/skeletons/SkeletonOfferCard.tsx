const SkeletonOfferCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-gray-200 to-gray-300" />
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 animate-pulse">
            {/* Badge + link row */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-24 bg-gray-200 rounded-lg" />
                <div className="h-4 w-14 bg-gray-100 rounded" />
            </div>
            {/* Name */}
            <div className="space-y-1.5">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-4/5 bg-gray-200 rounded" />
            </div>
            {/* Tests block */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
            {/* Price + buttons */}
            <div className="mt-auto space-y-3">
                <div className="h-8 w-24 bg-gray-200 rounded" />
                <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
                    <div className="w-20 h-10 bg-gray-100 rounded-xl" />
                </div>
            </div>
            {/* Trust row */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <div className="h-3 w-28 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
        </div>
    </div>
);

export default SkeletonOfferCard;
