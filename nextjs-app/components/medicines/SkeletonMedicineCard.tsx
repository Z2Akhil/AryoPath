export default function SkeletonMedicineCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="flex flex-col gap-2 p-2.5">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex items-center justify-between mt-1">
          <div className="h-4 bg-gray-100 rounded w-12" />
          <div className="h-7 bg-gray-100 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}
