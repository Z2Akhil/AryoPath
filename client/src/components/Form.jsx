import React, { useState } from "react";

const Form = ({ pkgName, pkgRate }) => {
  const [numPersons, setNumPersons] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);

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

  return (
    <div className="w-full bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
      {/* Heading */}
      <h3 className="text-center text-lg font-semibold text-gray-400">
        {pkgName}
      </h3>

      <h2 className="text-2xl font-bold text-gray-800 mt-2">Book Now, Pay Later</h2>
      <p className="text-green-700 font-medium mb-2">Simple Process, No Spam Calls</p>

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
              : `(₹${Math.round(pkgRate - 100)} per person)`}
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
          className="w-1/2 border border-gray-400 rounded px-3 py-2 text-sm"
        />
        <button className="w-1/2 border border-gray-400 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium">
          Check Availability
        </button>
      </div>

      {/* Appointment Date & Time */}
      <select className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2">
        <option>Select Preferred Appointment Date</option>
      </select>
      <select className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3">
        <option>Select Preferred Time Slot</option>
      </select>

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

      <p className="text-xs text-gray-600 mt-1">
        Order with incomplete/invalid address will be rejected.
      </p>
    </div>
  );
};

export default Form;
