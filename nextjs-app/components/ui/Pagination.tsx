interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem   = Math.min(currentPage * itemsPerPage, totalItems);

  // On mobile show 3 page slots, on desktop 5
  const getPageNumbers = (maxVisible: number) => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const half  = Math.floor(maxVisible / 2);
      let start   = Math.max(1, currentPage - half);
      const end   = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('…');
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('…');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageBtn = (page: number | string, key: number) => {
    const isActive  = page === currentPage;
    const isEllipsis = page === '…';
    return (
      <button
        key={key}
        onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
        disabled={isEllipsis}
        aria-current={isActive ? 'page' : undefined}
        className={`min-w-[36px] h-9 px-1 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : isEllipsis
            ? 'text-gray-400 cursor-default'
            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
        }`}
      >
        {page}
      </button>
    );
  };

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  const chevronBtn = (dir: 'prev' | 'next') => (
    <button
      onClick={() => onPageChange(dir === 'prev' ? currentPage - 1 : currentPage + 1)}
      disabled={dir === 'prev' ? prevDisabled : nextDisabled}
      aria-label={dir === 'prev' ? 'Previous page' : 'Next page'}
      className="min-w-[36px] h-9 px-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
    >
      {dir === 'prev' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-100">

      {/* ── Mobile layout (hidden on sm+) ─────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {/* Count row */}
        <p className="text-xs text-gray-500 text-center">
          Showing <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalItems}</span> results
        </p>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Items per page (compact) */}
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 pl-2 pr-6 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
          >
            <option value={20}>20 / page</option>
            <option value={40}>40 / page</option>
            <option value={60}>60 / page</option>
          </select>

          {/* Page buttons */}
          <div className="flex items-center gap-0.5">
            {chevronBtn('prev')}
            {getPageNumbers(3).map((p, i) => pageBtn(p, i))}
            {chevronBtn('next')}
          </div>
        </div>
      </div>

      {/* ── Desktop layout (hidden below sm) ──────────────────── */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Items per page */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-500">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="h-9 pl-2 pr-6 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px' }}
          >
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={60}>60</option>
          </select>
          <span className="text-sm text-gray-500">per page</span>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalItems}</span>
        </p>

        {/* Page buttons */}
        <div className="flex items-center gap-0.5">
          {chevronBtn('prev')}
          {getPageNumbers(5).map((p, i) => pageBtn(p, i))}
          {chevronBtn('next')}
        </div>
      </div>

    </div>
  );
};

export default Pagination;
