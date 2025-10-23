import React, { useState } from "react";
import { checkPincode } from "../api/pinCodeAvailabilityApi"; // adjust the path if needed

const Form = ({ pkgName, pkgRate }) => {
  const [numPersons, setNumPersons] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState([
    { name: "", age: "", gender: "" },
  ]);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loading, setLoading] = useState(false);


  const handlePersonsChange = (e) => {
    const count = parseInt(e.target.value);
    setNumPersons(count);
    setBeneficiaries(
      Array.from({ length: count }, () => ({ name: "", age: "", gender: "" }))
    );
  };

  const handleChange = (index, field, value) => {
    const updated = [...beneficiaries];
    updated[index][field] = value;
    setBeneficiaries(updated);
  };


  const handlePincodeCheck = async () => {
    if (!pincode || pincode.length !== 6) {
      setPincodeStatus("⚠️ Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      setLoading(true);
      setPincodeStatus(null);

      const response = await checkPincode(pincode);
      console.log("Pincode API Response:", response);

      // Check for known success cases
      if (response?.status === "Y" && response?.respId === "RES00001") {
        setPincodeStatus("✅ Service is available in your area!");
      }
      // Invalid API key
      else if (response?.respId === "RES01004") {
        setPincodeStatus("❌ Invalid API Key. Please check your configuration.");
      }
      // Area not served
      else if (response?.respId === "RES02001") {
        setPincodeStatus("❌ Sorry! Currently we are not serving this pincode.");
      }
      // Invalid product type or others
      else if (response?.respId === "RES02005") {
        setPincodeStatus("⚠️ Invalid product type. Please contact support.");
      }
      // Unknown but valid 200 response
      else if (response?.respId) {
        setPincodeStatus(`⚠️ ${response?.response || "Unexpected response received."}`);
      }
      // Server or validation errors
      else {
        setPincodeStatus("❌ Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.error("Pincode check failed:", error);
      if (error.response?.status === 400) {
        setPincodeStatus("❌ Invalid request. Please check the pincode format.");
      } else if (error.response?.status === 500) {
        setPincodeStatus("❌ Server error. Please try again later.");
      } else {
        setPincodeStatus("❌ Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
      {/* Heading */}
      <h3 className="text-center text-lg font-semibold text-gray-400">
        {pkgName}
      </h3>

      <h2 className="text-2xl font-bold text-gray-800 mt-2">
        Book Now, Pay Later
      </h2>
      <p className="text-green-700 font-medium mb-2">
        Simple Process, No Spam Calls
      </p>

      {/* Number of Persons */}
      <select
        value={numPersons}
        onChange={handlePersonsChange}
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
      >
        {[...Array(10)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}{" "}
            {i + 1 === 1
              ? `(₹${pkgRate})`
              : `(₹${Math.round(pkgRate)} per person)`}
          </option>
        ))}
      </select>

      {/* Pincode & Availability */}
      <p className="text-sm mb-1">
        Write <strong>Exact Pincode</strong>, not nearby Pincode
      </p>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handlePincodeCheck}
          disabled={loading}
          className={`w-1/2 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium ${loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
          {loading ? "Checking..." : "Check Availability"}
        </button>
      </div>

      {/* Pincode Status Message */}
      {pincodeStatus && (
        <p
          className={`text-sm mb-3 ${pincodeStatus.includes("✅")
              ? "text-green-600"
              : "text-red-600"
            }`}
        >
          {pincodeStatus}
        </p>
      )}

      <p className="text-sm mb-2">
        Write <strong>FULL NAME</strong> for all persons.
      </p>

      {/* Beneficiary Fields */}
      {beneficiaries.map((b, index) => (
        <div key={index} className="mb-3">
          <input
            type="text"
            placeholder={`Beneficiary Name ${index + 1}`}
            className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
            value={b.name}
            onChange={(e) => handleChange(index, "name", e.target.value)}
          />
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Age"
              className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
              value={b.age}
              onChange={(e) => handleChange(index, "age", e.target.value)}
            />
            <select
              value={b.gender}
              onChange={(e) => handleChange(index, "gender", e.target.value)}
              className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      ))}

      {/* Contact Info */}
      <input
        type="email"
        placeholder="Email"
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
      />
      <input
        type="text"
        placeholder="Mobile (Indian Number Only)"
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
      />
      <textarea
        rows="2"
        placeholder="Complete Address"
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
      ></textarea>

      {/* Appointment Date & Time */}
      <select className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2">
        <option>Select Preferred Appointment Date</option>
      </select>
      <select className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3">
        <option>Select Preferred Time Slot</option>
      </select>

      <p className="text-xs text-gray-600 mt-1">
        Order with incomplete/invalid address will be rejected.
      </p>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-2 my-3 rounded hover:bg-blue-700 transition-colors"
      >
        Submit
      </button>

    </div>
  );
};

export default Form;
