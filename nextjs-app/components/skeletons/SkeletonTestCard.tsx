const SkeletonTestCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-3 flex flex-col flex-1 gap-2.5 animate-pulse">
            {/* Category chip */}
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            {/* Name */}
            <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-full bg-gray-200 rounded" />
                <div className="h-3.5 w-4/5 bg-gray-200 rounded" />
                <div className="h-3.5 w-3/5 bg-gray-200 rounded" />
            </div>
            {/* Price row */}
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <div className="h-6 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-100 rounded-full" />
                </div>
                <div className="h-5 w-14 bg-gray-100 rounded-full" />
            </div>
            {/* Button */}
            <div className="h-9 w-full bg-gray-200 rounded-xl" />
        </div>
    </div>
);

export default SkeletonTestCard;
