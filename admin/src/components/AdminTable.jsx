import React, { useState, useMemo } from "react";
import { Pencil } from "lucide-react";

const AdminTable = ({ data, editableFields = [], onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");

  if (!data || data.length === 0)
    return <p className="text-center p-4">No data available.</p>;

  const columns = ["name", "rate", "category", "margin"];
  const heading = ["NAME", "SELLING PRICE", "CATEGORY", "MARGIN"];

  // --- Filter + Sort ---
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
    } else if (sortOption === "marginDesc") {
      filtered = [...filtered].sort((a, b) => (b.margin || 0) - (a.margin || 0));
    }

    return filtered;
  }, [data, searchTerm, sortOption]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Top Controls */}
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
          <option value="marginDesc">Margin ↓</option>
        </select>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <table className="min-w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 sticky top-0 z-10 text-gray-700 text-sm uppercase tracking-wide">
            <tr>
              {heading.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 border-b font-semibold whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="px-4 py-3 border-b text-center font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-blue-50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 border-b text-gray-800 whitespace-nowrap"
                    >
                      {col === "rate"
                        ? `₹${item.rate?.offerRate || item.rate?.b2C || "-"}`
                        : item[col] || "-"}
                    </td>
                  ))}
                  <td className="px-4 py-3 border-b text-center">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
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
