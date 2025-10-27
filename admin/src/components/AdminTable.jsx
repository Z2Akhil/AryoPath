import React, { useState, useMemo } from "react";
import { Pencil } from "lucide-react";

const AdminTable = ({ data, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");

  if (!data || data.length === 0)
    return <p className="text-center p-4">No data available.</p>;

  // Table headings
  const headings = [
    "NAME",
    "CATEGORY",
    "THYROCARE RATE (b2C)",
    "THYROCARE MARGIN",
    "SELLING PRICE",
    "ACTUAL MARGIN",
    "ACTIONS",
  ];

  // --- Filter + Sort Logic ---
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(lowerSearch) ||
          item.category?.toLowerCase().includes(lowerSearch)
      );
    }

    if (sortOption === "priceDesc") {
      filtered = [...filtered].sort(
        (a, b) =>
          (b.rate?.offerRate || b.rate?.b2C || 0) -
          (a.rate?.offerRate || a.rate?.b2C || 0)
      );
    } else if (sortOption === "nameAsc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [data, searchTerm, sortOption]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* --- Top Controls --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
        <input
          type="text"
          placeholder="🔍 Search by name or category..."
          className="border border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-100 outline-none transition-all p-2.5 rounded-md w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-md w-full sm:w-1/4 focus:border-blue-400 focus:ring focus:ring-blue-100 outline-none transition-all"
        >
          <option value="">Sort By</option>
          <option value="priceDesc">Price ↓</option>
          <option value="nameAsc">Name A → Z</option>
        </select>
      </div>

      {/* --- Scrollable Table --- */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <table className="min-w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 sticky top-0 z-10 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              {headings.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 border-b font-semibold whitespace-nowrap text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => {
                const b2B = parseFloat(item.rate?.b2B || 0);
                const b2C = parseFloat(item.rate?.offerRate||item.rate?.b2C || 0);
                const offerRate = parseFloat(item.rate?.offerRate || 0);

                const thyrocareMargin = parseFloat(item.margin);

                // Use overridden selling price or fallback to offerRate or null
                const sellingPrice =  offerRate ?? null;

                // Actual margin = selling price - b2B
                const actualMargin = thyrocareMargin-(b2C-sellingPrice);
                  

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-blue-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 border-b">{item.name || "-"}</td>
                    <td className="px-4 py-3 border-b">{item.category || "-"}</td>
                    <td className="px-4 py-3 border-b text-blue-700 font-medium">
                      ₹{b2C || "-"}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-800">
                      ₹{thyrocareMargin.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 border-b">
                      ₹{sellingPrice !== null ? sellingPrice : "-"}
                    </td>
                    <td
                      className={`px-4 py-3 border-b font-medium ${
                        actualMargin < 0
                          ? "text-red-600"
                          : actualMargin > 0
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {actualMargin !== null ? `₹${actualMargin.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 border-b text-center">
                      <button
                        onClick={() => onEdit(sellingPrice)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit Selling Price"
                      >
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={headings.length}
                  className="text-center py-6 text-gray-500"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
