import React, { useState } from "react";
import { X } from "lucide-react";

const EditModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    offerRate: item.rate.offerRate,
    margin: item.margin,
    category: item.category || "",
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px] relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Edit Package</h2>

        {["offerRate", "margin", "category"].map((key) => (
          <div key={key} className="mb-3">
            <label className="block text-sm font-medium mb-1">
              {key.toUpperCase()}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        ))}

        <button
          onClick={() => onSave(form)}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditModal;
