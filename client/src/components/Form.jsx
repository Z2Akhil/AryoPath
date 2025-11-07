import { useState, useEffect } from "react";
import { checkPincode } from "../api/pinCodeAvailabilityApi";
import { getAppointmentSlots } from "../api/appointmentSlotApi";
import { useUser } from "../context/userContext";
import { 
  getInitialFormData, 
  saveContactInfo 
} from "../utils/localStorage";
import BeneficiaryManager from "./BeneficiaryManager";

const Form = ({ pkgRate, pkgId }) => {
  const { user } = useUser();
  const [numPersons, setNumPersons] = useState(1);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showBeneficiaryManager, setShowBeneficiaryManager] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    mobile: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      landmark: ""
    }
  });
  const [saveContactForFuture, setSaveContactForFuture] = useState(false);

  useEffect(() => {
    if (user) {
      const initialData = getInitialFormData();
      setSelectedBeneficiaries(initialData.beneficiaries);
      
      // Auto-fill contact information from user profile
      const autoFilledContactInfo = {
        email: user.email || initialData.contactInfo.email,
        mobile: user.mobileNumber || initialData.contactInfo.mobile,
        address: {
          street: user.address || initialData.contactInfo.address.street,
          city: user.city || initialData.contactInfo.address.city,
          state: user.state || initialData.contactInfo.address.state,
          pincode: initialData.contactInfo.address.pincode,
          landmark: initialData.contactInfo.address.landmark
        }
      };
      
      setContactInfo(autoFilledContactInfo);
      setPincode(initialData.contactInfo.address.pincode);
    }
  }, [user]);

  const handlePersonsChange = (e) => {
    const count = parseInt(e.target.value);
    setNumPersons(count);
    setSelectedBeneficiaries(Array.from({ length: count }, () => ({ name: "", age: "", gender: "" })));
  };

  const handleSelectBeneficiary = (beneficiary) => {
    const isAlreadySelected = selectedBeneficiaries.some(b => b.name === beneficiary.name);
    if (isAlreadySelected) {
      alert('This beneficiary is already selected. Please choose a different beneficiary.');
      return;
    }
    
    const updatedBeneficiaries = [...selectedBeneficiaries];
    const emptyIndex = updatedBeneficiaries.findIndex(b => !b.name);
    
    if (emptyIndex >= 0) {
      updatedBeneficiaries[emptyIndex] = beneficiary;
      setSelectedBeneficiaries(updatedBeneficiaries);
    } else {
      updatedBeneficiaries[0] = beneficiary;
      setSelectedBeneficiaries(updatedBeneficiaries);
    }
  };

  const handleRemoveBeneficiary = (index) => {
    const updatedBeneficiaries = [...selectedBeneficiaries];
    updatedBeneficiaries[index] = { name: "", age: "", gender: "" };
    setSelectedBeneficiaries(updatedBeneficiaries);
  };

  const handleContactInfoChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setContactInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setContactInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (saveContactForFuture) {
      saveContactInfo(contactInfo);
    }
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
        setPincodeStatus(`${response?.response || "Service not available"}`);
      }
    } catch (error) {
      setPincodeStatus("Error checking pincode");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentSlots = async () => {
    if (!appointmentDate) return;

    try {
      setLoading(true);

      let items = [];

      if (Array.isArray(pkgId)) {
        items = pkgId.map((id) => ({
          Id: id,
          PatientQuantity: numPersons,
          PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
        }));
      } else {
        items = [
          {
            Id: pkgId,
            PatientQuantity: numPersons,
            PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
          },
        ];
      }

      const patients = selectedBeneficiaries.map((b, i) => ({
        Id: i + 1,
        Name: b.name,
        Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
        Age: parseInt(b.age),
      }));

      const payload={
        pincode,
        date: appointmentDate,
        patients,
        BenCount: numPersons,
        items,
      };

      const response = await getAppointmentSlots(payload);
       
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
    <>
      <form onSubmit={handleSubmit} className="w-full bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mt-2">Book Now, Pay Later</h2>
        <p className="text-green-700 font-medium mb-2">Simple Process, No Spam Calls</p>
        <select
          value={numPersons}
          onChange={handlePersonsChange}
          className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-3"
        >
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} {i + 1 === 1 ? 'Person' : 'Persons'}
              {i + 1 === 1 ? ` (₹${pkgRate})` : ` (₹${(i+1)*pkgRate} only)`}
            </option>
          ))}
        </select>
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
          <p className={`text-sm mb-3 ${pincodeStatus.includes("✅") ? " text-green-600" : "text-red-600"}`}>
            {pincodeStatus}
          </p>
        )}

        {/* Beneficiary Selection Section */}
        <div className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Select Beneficiaries ({numPersons} required)</p>
          
          {/* Show selected beneficiaries */}
          {selectedBeneficiaries.map((beneficiary, index) => (
            beneficiary.name ? (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Beneficiary {index + 1}: {beneficiary.name}</p>
                    <p className="text-sm text-gray-600">
                      {beneficiary.age} years • {beneficiary.gender}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBeneficiary(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-sm">Beneficiary {index + 1} not selected</p>
                  <button
                    type="button"
                    onClick={() => setShowBeneficiaryManager(true)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Add Beneficiary
                  </button>
                </div>
              </div>
            )
          ))}
          
          {selectedBeneficiaries.filter(b => !b.name).length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedBeneficiaries.filter(b => !b.name).length} more beneficiary(ies) required
            </p>
          )}
        </div>

        <div className="mb-4">
          <p className="font-medium text-gray-800 mb-2">Contact Information</p>
          
          {/* Email Field */}
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.email}
              onChange={(e) => handleContactInfoChange('email', e.target.value)}
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Mobile Number</label>
            <input 
              type="text" 
              placeholder="Mobile Number" 
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.mobile}
              onChange={(e) => handleContactInfoChange('mobile', e.target.value)}
            />
          </div>
          
          {/* Address Field */}
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <textarea 
              rows="2" 
              placeholder="Street address, area, landmark" 
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
              value={contactInfo.address.street}
              onChange={(e) => handleContactInfoChange('address.street', e.target.value)}
            />
          </div>
          
          {/* City and State Fields */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                value={contactInfo.address.city}
                onChange={(e) => handleContactInfoChange('address.city', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">State</label>
              <input
                type="text"
                placeholder="State"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                value={contactInfo.address.state}
                onChange={(e) => handleContactInfoChange('address.state', e.target.value)}
              />
            </div>
          </div>
          
          {/* Save Contact Option */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="saveContact"
              checked={saveContactForFuture}
              onChange={(e) => setSaveContactForFuture(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="saveContact" className="text-sm text-gray-600">
              Save this contact information for future bookings
            </label>
          </div>
          
          {/* Show saved status */}
          {contactInfo.email && contactInfo.address.city && contactInfo.address.state && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <p className="text-sm text-blue-700">
                ✓ Contact information will be saved for future use
              </p>
            </div>
          )}
        </div>

        <p className="text-sm mb-3">make sure to fill the above fields first.</p>
        <select
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          onBlur={fetchAppointmentSlots}
          className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-2"
        >
          <option value="">Select Preferred Appointment Date</option>
          {[...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);

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
          BOOK NOW
        </button>
      </form>

      <BeneficiaryManager
        isOpen={showBeneficiaryManager}
        onClose={() => setShowBeneficiaryManager(false)}
        onSelectBeneficiary={handleSelectBeneficiary}
      />
    </>
  );
};

export default Form;
