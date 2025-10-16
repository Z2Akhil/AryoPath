// Paste the BookingForm.js code from the previous response here.
// It is ready to be used without any changes.
import React, { useState, useEffect } from 'react';

const FormInput = ({ label, type = 'text', placeholder, value, onChange, name }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input type={type} id={name} name={name} placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" />
  </div>
);

const FormSelect = ({ label, name, value, onChange, children }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <select id={name} name={name} value={value} onChange={onChange} className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500">{children}</select>
  </div>
);

const BookingForm = ({ packageName = "Executive Full Body Health Checkup", packagePrice = 1579 }) => {
  const [numPersons, setNumPersons] = useState(1);
  const [beneficiaries, setBeneficiaries] = useState([{ name: '', age: '', gender: '' }]);
  const [pincode, setPincode] = useState('');
  const [receiveHardCopy, setReceiveHardCopy] = useState(false);
  const [formData, setFormData] = useState({ appointmentDate: '', timeSlot: '', email: '', mobile: '', address: '' });

  useEffect(() => {
    const newBeneficiaries = Array.from({ length: numPersons }, (_, i) => beneficiaries[i] || { name: '', age: '', gender: '' });
    setBeneficiaries(newBeneficiaries);
  }, [numPersons]);

  const handleBeneficiaryChange = (index, event) => {
    const newBeneficiaries = [...beneficiaries];
    newBeneficiaries[index][event.target.name] = event.target.value;
    setBeneficiaries(newBeneficiaries);
  };
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData, pincode, numPersons, beneficiaries, receiveHardCopy, totalAmount: packagePrice };
    console.log("Form Submitted:", submissionData);
    alert("Booking details submitted! Check the console for the data object.");
  };

  return (
    <div className="bg-[#0b1727] p-6 sm:p-8 max-w-2xl mx-auto rounded-lg text-white font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">{packageName}</h1>
      <div className="text-center mb-6"><p className="text-lg font-semibold text-green-400">Book Now, Pay Later</p><p className="text-sm text-gray-300">Simple Process, No Spam Calls</p></div>
      <p className="text-sm text-center bg-gray-700/50 border border-dashed border-gray-500 p-3 rounded-md mb-6">Want to add more tests? <a href="#" className="text-blue-400 font-semibold underline">Click add to cart</a>, else fill up below form.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect label="Number of Persons" name="numPersons" value={numPersons} onChange={(e) => setNumPersons(parseInt(e.target.value, 10))}>{[...Array(10).keys()].map(n => <option key={n + 1} value={n + 1}>{n + 1}</option>)}</FormSelect>
          <div><label htmlFor="pincode" className="block text-sm font-medium text-gray-300 mb-1">Write <span className="font-bold">Exact Pincode</span>, not nearby Pincode</label><div className="flex"><input type="text" id="pincode" name="pincode" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="flex-grow bg-gray-600 border border-gray-500 rounded-l-md p-2 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" /><button type="button" className="bg-gray-500 text-white font-bold py-2 px-4 rounded-r-md hover:bg-gray-400 transition-colors">Check Availability</button></div></div>
          <FormSelect label="Select Preferred Appointment Date" name="appointmentDate" value={formData.appointmentDate} onChange={handleInputChange}><option value="">Select Date</option><option value="2025-10-17">October 17, 2025</option><option value="2025-10-18">October 18, 2025</option></FormSelect>
          <FormSelect label="Select Preferred Time Slot" name="timeSlot" value={formData.timeSlot} onChange={handleInputChange}><option value="">Select Time</option><option value="08:00-09:00">08:00 AM - 09:00 AM</option><option value="09:00-10:00">09:00 AM - 10:00 AM</option></FormSelect>
        </div>
        <hr className="border-gray-600" />
        <div>
          <h2 className="text-lg font-semibold mb-2">Write <span className="font-bold">FULL NAME</span> for all persons.</h2>
          <div className="space-y-4">{beneficiaries.map((ben, index) => (<div key={index} className="p-4 border border-gray-700 rounded-md space-y-4"><p className="font-semibold text-gray-300">Beneficiary {index + 1}</p><FormInput label="Beneficiary Name" name="name" placeholder={`Beneficiary Name ${index + 1}`} value={ben.name} onChange={(e) => handleBeneficiaryChange(index, e)} /><div className="grid grid-cols-2 gap-4"><FormInput label="Age" type="number" name="age" placeholder="Age" value={ben.age} onChange={(e) => handleBeneficiaryChange(index, e)} /><FormSelect label="Select Gender" name="gender" value={ben.gender} onChange={(e) => handleBeneficiaryChange(index, e)}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></FormSelect></div></div>))}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormInput label="Email" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange}/><FormInput label="Mobile (Indian Number Only)" type="tel" name="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleInputChange}/></div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Complete Address</label>
          <textarea id="address" name="address" rows="4" className="w-full bg-gray-600 border border-gray-500 rounded-md p-2 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" placeholder="Your full address for sample collection" value={formData.address} onChange={handleInputChange}></textarea>
          <p className="text-xs text-red-400 mt-1">Order with incomplete/invalid address will be rejected.</p>
        </div>
        <hr className="border-gray-600" />
        <div className="space-y-4">
            <div className="flex items-center"><input id="receiveHardCopy" name="receiveHardCopy" type="checkbox" checked={receiveHardCopy} onChange={(e) => setReceiveHardCopy(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="receiveHardCopy" className="ml-2 block text-sm text-gray-200">Please Tick To Receive Hard Copy Report</label></div>
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-lg"><span>Test/Package Price:</span><span>₹ {packagePrice}</span></div>
                <div className="flex justify-between text-lg text-green-400"><span>Home Collection Charge:</span><span>₹ 0</span></div>
                <div className="flex justify-between text-xl font-bold border-t border-gray-600 pt-2 mt-2"><span>Total Amount:</span><span>₹ {packagePrice}</span></div>
            </div>
            <p className="text-sm text-yellow-300"><span className="font-bold">Note:</span> Payment should be made before or at the time of sample collection.</p>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 px-4 rounded-md transition-colors">Book Now</button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;