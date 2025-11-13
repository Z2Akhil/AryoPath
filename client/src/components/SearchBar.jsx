import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../api/productApi";
import { useCart } from "../context/CartContext";

const SearchBar = () => {
    const [query, setQuery] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const navigate = useNavigate();
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    const { cart, addToCart, removeFromCart } = useCart();

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

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search input update
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setShowDropdown(value.trim().length > 1);
        }, 250);
    };

    const results = useMemo(() => {
        if (query.trim().length <= 1) return [];
        const lower = query.toLowerCase();
        return allProducts.filter((item) =>
            item.name.toLowerCase().includes(lower)
        );
    }, [query, allProducts]);

    const isInCart = (item) => {
        return cart.items?.some((p) => p.productCode === item.code);
    };

    const handleSelect = (item) => {
        setShowDropdown(false);
        navigate(`/packages/${item.code}`, { state: { product: item } });
    };

    const handleKeyDown = (e) => {
        if (!results.length) return;

        if (e.key === "ArrowDown") {
            setHighlightIndex((prev) => (prev + 1) % results.length);
        }

        if (e.key === "ArrowUp") {
            setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
        }

        if (e.key === "Enter") {
            const item = results[highlightIndex];
            if (item.type === "PACKAGE") {
                handleSelect(item);
            } else {
                addToCart(item);
            }
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto">
            
            {/* Input box */}
            <div className="flex items-center bg-white border-2 border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:border-blue-500 transition">
                <Search className="h-5 w-5 text-gray-500 mr-2" />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search tests, packages, and offers..."
                    className="flex-1 outline-none text-sm"
                />
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto animate-fadeSlide z-50"
                >
                    {loading ? (
                        <div className="flex items-center justify-center p-4 text-gray-600">
                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                            Loading...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="divide-y">
                            {results.map((item, index) => {
                                const isActive = index === highlightIndex;

                                return (
                                    <li
                                        key={item.code}
                                        className={`px-4 py-3 cursor-pointer transition
                                            ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{item.name}</p>

                                                <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full 
                                                    ${item.type === "TEST"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-blue-100 text-blue-700"}
                                                    `}
                                                >
                                                    {item.type === "TEST" ? "Test" : "Package"}
                                                </span>
                                            </div>

                                            {/* Buttons */}
                                            {item.type === "TEST" ? (
                                                isInCart(item) ? (
                                                    <button
                                                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700"
                                                        onMouseDown={() => removeFromCart(item.code)}
                                                    >
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
                                                        onMouseDown={() => addToCart(item)}
                                                    >
                                                        Add
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full hover:bg-gray-900"
                                                    onMouseDown={() => handleSelect(item)}
                                                >
                                                    View
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-gray-600">
                            No results found
                        </div>
                    )}
                </div>
            )}

            {/* Animation styles */}
            <style>
                {`
                .animate-fadeSlide {
                    animation: fadeSlide 0.18s ease-out;
                }
                @keyframes fadeSlide {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default SearchBar;
