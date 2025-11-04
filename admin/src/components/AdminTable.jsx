import React, { useState, useMemo } from "react";
import { Pencil, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { axiosInstance } from "../api/axiosInstance";

const AdminTable = ({ data, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [localData, setLocalData] = useState(data || []);
  const [loadingStates, setLoadingStates] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState({});

  React.useEffect(() => {
    setLocalData(data || []);
    setUnsavedChanges({});
  }, [data]);

  if (!localData || localData.length === 0)
    return <p className="text-center p-4">No data available.</p>;

  const hideCategory = localData[0]?.type === "OFFER";

  const headings = [
    "ID",
    "NAME",
    ...(hideCategory ? [] : ["CATEGORY"]),
    "THYROCARE RATE",
    "THYROCARE MARGIN",
    "DISCOUNT",
    "SELLING PRICE",
    "ACTIONS",
  ];

  const handleDiscountChange = (code, newDiscount) => {
    const product = localData.find(item => item.code === code);
    if (!product) return;

    const maxDiscount = product.thyrocareMargin || 0;
    const validatedDiscount = Math.max(0, Math.min(newDiscount, maxDiscount));

    const thyrocareRate = product.thyrocareRate || 0;
    const newSellingPrice = thyrocareRate - validatedDiscount;

    const updatedData = localData.map(item => 
      item.code === code 
        ? { 
            ...item, 
            discount: validatedDiscount,
            sellingPrice: newSellingPrice
          }
        : item
    );

    setLocalData(updatedData);
    
    const originalProduct = data.find(item => item.code === code);
    const hasChanges = originalProduct && originalProduct.discount !== validatedDiscount;
    
    setUnsavedChanges(prev => ({
      ...prev,
      [code]: hasChanges
    }));
  };

  const handleSync = async (code) => {
    const product = localData.find(item => item.code === code);
    if (!product) return;

    setLoadingStates(prev => ({ ...prev, [code]: true }));

    try {
      const response = await axiosInstance.put('/admin/products/pricing', {
        code: code,
        discount: product.discount || 0
      });

      if (response.data.success) {
        const updatedData = localData.map(item => 
          item.code === code 
            ? { ...item, ...response.data.product, isCustomized: true }
            : item
        );

        setLocalData(updatedData);
        setUnsavedChanges(prev => ({ ...prev, [code]: false }));
        
        // Show success feedback
        console.log(`Pricing updated for ${product.name}`);
      }
    } catch (error) {
      console.error('Failed to update pricing:', error);
      // You could add toast notification here
    } finally {
      setLoadingStates(prev => ({ ...prev, [code]: false }));
    }
  };

  // --- Filter + Sort Logic ---
  const filteredData = useMemo(() => {
    let filtered = localData;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(lowerSearch) ||
          item.code?.toLowerCase().includes(lowerSearch) ||
          (!hideCategory && item.category?.toLowerCase().includes(lowerSearch))
      );
    }

    if (sortOption === "priceDesc") {
      filtered = [...filtered].sort(
        (a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0)
      );
    } else if (sortOption === "nameAsc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "discountDesc") {
      filtered = [...filtered].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return filtered;
  }, [localData, searchTerm, sortOption, hideCategory]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* --- Top Controls --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
        <input
          type="text"
          placeholder={`🔍 Search by ID, name${hideCategory ? "" : " or category"}...`}
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
          <option value="priceDesc">Selling Price ↓</option>
          <option value="nameAsc">Name A → Z</option>
          <option value="discountDesc">Discount ↓</option>
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
                const thyrocareRate = parseFloat(item.thyrocareRate || 0);
                const thyrocareMargin = parseFloat(item.thyrocareMargin || 0);
                const discount = parseFloat(item.discount || 0);
                const sellingPrice = parseFloat(item.sellingPrice || thyrocareRate);
                const hasUnsavedChanges = unsavedChanges[item.code];
                const isLoading = loadingStates[item.code];

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-blue-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } ${hasUnsavedChanges ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 border-b font-mono text-xs text-gray-500">
                      {item.code || "-"}
                    </td>
                    
                    {/* Name */}
                    <td className="px-4 py-3 border-b">{item.name || "-"}</td>
                    
                    {/* Category */}
                    {!hideCategory && (
                      <td className="px-4 py-3 border-b">{item.category || "-"}</td>
                    )}
                    
                    {/* ThyroCare Rate */}
                    <td className="px-4 py-3 border-b text-blue-700 font-medium">
                      ₹{thyrocareRate || "-"}
                    </td>
                    
                    {/* ThyroCare Margin */}
                    <td className="px-4 py-3 border-b text-gray-800">
                      ₹{thyrocareMargin.toFixed(2)}
                    </td>
                    
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={thyrocareMargin}
                          value={discount}
                          onChange={(e) => handleDiscountChange(item.code, parseFloat(e.target.value) || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 border-b font-medium">
                      <div className="flex items-center space-x-1">
                        <span className={`${hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}`}>
                          ₹{sellingPrice.toFixed(2)}
                        </span>
                        {hasUnsavedChanges && (
                          <AlertCircle size={14} className="text-orange-500" />
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 border-b text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleSync(item.code)}
                          disabled={!hasUnsavedChanges || isLoading}
                          className={`px-2 py-1 text-xs rounded transition ${
                            hasUnsavedChanges 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          } ${isLoading ? 'animate-pulse' : ''}`}
                          title={hasUnsavedChanges ? "Save changes to database" : "No changes to save"}
                        >
                          {isLoading ? 'Syncing...' : 'Sync'}
                        </button>
                      </div>
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
      
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>Showing {filteredData.length} of {localData.length} products</span>
          {Object.values(unsavedChanges).filter(Boolean).length > 0 && (
            <span className="text-orange-600 font-medium">
              {Object.values(unsavedChanges).filter(Boolean).length} unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTable;
