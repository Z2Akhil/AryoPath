import React, { useState, useEffect } from "react";
import { checkPincode } from "../api/pinCodeAvailabilityApi";
import { getAppointmentSlots } from "../api/appointmentSlotApi"; // import your API function

const Form = ({ pkgName, pkgRate, pkgId }) => {
  const [numPersons, setNumPersons] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const handlePersonsChange = (e) => {
    const count = parseInt(e.target.value);
    setNumPersons(count);
    setBeneficiaries(Array.from({ length: count }, () => ({ name: "", age: "", gender: "" })));
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

      if (response?.status === "Y" && response?.respId === "RES00001") {
        setPincodeStatus("✅ Service is available in your area!");
      } else {
        setPincodeStatus(`❌ ${response?.response || "Service not available"}`);
      }
    } catch (error) {
      setPincodeStatus("❌ Error checking pincode");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentSlots = async () => {
    if (!appointmentDate) return;

    try {
      setLoading(true);
      const items = [
        { Id: pkgId, PatientQuantity: numPersons, PatientIds: beneficiaries.map((_, i) => i + 1) },
      ];

      const patients = beneficiaries.map((b, i) => ({
        Id: i + 1,
        Name: b.name,
        Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
        Age: parseInt(b.age),
      }));

      const response = await getAppointmentSlots({
        pincode,
        date: appointmentDate,
        patients,
        items,
      });

      if (response?.respId === "RES00001") {
        setAvailableSlots(response.lSlotDataRes || []);
      } else {
        setAvailableSlots([]);
        alert(response?.response || "No slots available");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
      alert("Failed to fetch slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
      <h3 className="text-center text-lg font-semibold text-gray-400">{pkgName}</h3>
      <h2 className="text-2xl font-bold text-gray-800 mt-2">Book Now, Pay Later</h2>
      <p className="text-green-700 font-medium mb-2">Simple Process, No Spam Calls</p>

      <select
        value={numPersons}
        onChange={handlePersonsChange}
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
      >
        {[...Array(10)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1 === 1 ? `(₹${pkgRate})` : `(₹${pkgRate} per person)`}
          </option>
        ))}
      </select>

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
          className={`w-1/2 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {loading ? "Checking..." : "Check Availability"}
        </button>
      </div>

      {pincodeStatus && (
        <p className={`text-sm mb-3 ${pincodeStatus.includes("✅") ? "text-green-600" : "text-red-600"}`}>
          {pincodeStatus}
        </p>
      )}

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

      <input type="email" placeholder="Email" className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2" />
      <input type="text" placeholder="Mobile (Indian Number Only)" className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2" />
      <textarea rows="2" placeholder="Complete Address" className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"></textarea>

      <select
        value={appointmentDate}
        onChange={(e) => setAppointmentDate(e.target.value)}
        onBlur={fetchAppointmentSlots}
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
      >
        <option value="">Select Preferred Appointment Date</option>
        {/* You can dynamically generate next 7 days */}
        {[...Array(7)].map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);

          // Format as YYYY-MM-DD in local time
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const formatted = `${year}-${month}-${day}`;
          return (
            <option key={i} value={formatted}>
              {formatted}
            </option>
          );
        })}
      </select>

      <select
        value={selectedSlot}
        onChange={(e) => setSelectedSlot(e.target.value)}
        className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
      >
        <option value="">Select Preferred Time Slot</option>
        {availableSlots.map((slot) => (
          <option key={slot.id} value={slot.id}>
            {slot.slot}
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-600 mt-1">
        Order with incomplete/invalid address will be rejected.
      </p>

      <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 my-3 rounded hover:bg-blue-700 transition-colors">
        Submit
      </button>
    </div>
  );
};

export default Form;
