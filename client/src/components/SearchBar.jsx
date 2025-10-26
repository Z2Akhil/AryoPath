import { useState, useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/productApi";

const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const debounceRef = useRef(null);

    /** ✅ Fetch ALL products once on mount */
    useEffect(() => {
        (async () => {
            try {
                const data = await getProducts("ALL");
                const unique = Array.from(new Map(data.map((p) => [p.code, p])).values());
                setAllProducts(unique || []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /** 🔍 Debounced input handling */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Clear previous debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Debounce logic (wait 300ms after typing stops)
        debounceRef.current = setTimeout(() => {
            setShowDropdown(value.trim().length > 1);
        }, 300);
    };

    /** 🧠 Memoized filtering (only recompute when query or products change) */
    const results = useMemo(() => {
        if (query.trim().length <= 1) return [];
        const lower = query.toLowerCase();
        return allProducts.filter((item) => item.name.toLowerCase().includes(lower));
    }, [query, allProducts]);

    /** 🧭 Navigate to detailed page on selection */
    const handleSelect = (item) => {
        setShowDropdown(false);
        setQuery("");
        navigate(`/packages/${item.code}`, { state: { product: item } });
    };

    return (
        <div className="relative w-full max-w-xl group">
            {/* Search icon */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>

            {/* Input */}
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.length > 1 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Search health packages, tests, and more..."
                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full text-sm bg-white/80 backdrop-blur-sm
                   placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                   transition-all duration-300 hover:border-gray-300 shadow-sm hover:shadow-md"
            />

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-2">
                    {loading ? (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center">
                            Loading...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                            {results.map((item) => (
                                <li
                                    key={item._id}
                                    onMouseDown={() => handleSelect(item)}  // ✅ changed from onClick to onMouseDown
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    {item.category && (
                                        <p className="text-xs text-gray-500">{item.category}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : query.trim().length > 1 ? (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center">
                            No results found
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
