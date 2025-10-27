// src/components/RescheduleModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/userContext'; // Import context hook
import Modal from './Modal'; // Your generic modal component
import { Calendar as CalendarIcon, Clock, Loader, AlertCircle } from 'lucide-react';

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Expects 'order' prop with { orderNo, pincode?, benMaster? }
// Expects 'onClose' function to close the modal
// Expects 'onSuccess' function to call after successful reschedule
const RescheduleModal = ({ order, onClose, onSuccess }) => {
  // Get functions from context
  const { fetchAppointmentSlots, rescheduleOrder } = useUser();

  // Calculate valid date range (tomorrow to 7 days from now)
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const dt = new Date(today);
    dt.setDate(today.getDate() + 1);
    return dt;
  }, [today]);
  const maxDate = useMemo(() => {
      const dt = new Date(today);
      dt.setDate(today.getDate() + 7);
      return dt;
  }, [today]);

  // --- State Variables ---
  const [selectedDate, setSelectedDate] = useState(formatDate(tomorrow)); // Default to tomorrow
  const [slots, setSlots] = useState([]); // Holds fetched slots
  const [selectedSlot, setSelectedSlot] = useState(null); // Holds the chosen slot object { id, slot }
  const [reason, setReason] = useState(''); // Holds the reschedule reason

  // Loading/Error States
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // --- End State ---

  // Extract necessary info from order prop, provide fallbacks
  const orderPincode = order?.pincode || '333333'; // Use order pincode or a fallback if needed
  const benCount = order?.benMaster?.length || 1; // Get beneficiary count, default to 1

  // Effect to fetch appointment slots when the selected date changes
  useEffect(() => {
    const loadSlots = async () => {
      // Ensure function exists and necessary data is present
      if (!orderPincode || !selectedDate || typeof fetchAppointmentSlots !== 'function') {
          setSlots([]);
          setSlotsError("Missing information to fetch slots.");
          return;
      }
      setSlotsLoading(true); // Show loading indicator
      setSlotsError('');     // Clear previous errors
      setSelectedSlot(null); // Reset selected slot when date changes
      setSlots([]);          // Clear old slots
      try {
        console.log(`RescheduleModal: Fetching slots for pincode ${orderPincode} on date ${selectedDate}`);
        // Call the context function (currently placeholder)
        const fetchedSlots = await fetchAppointmentSlots(orderPincode, selectedDate, benCount);
        console.log("RescheduleModal: Slots received:", fetchedSlots);
        setSlots(fetchedSlots || []); // Update state with fetched slots
        // Set error if no slots are returned
        if (!fetchedSlots || fetchedSlots.length === 0) {
            setSlotsError("No slots available for this date. Please select another date.");
        }
      } catch (err) {
        console.error("RescheduleModal: Error fetching slots:", err);
        setSlotsError(err.message || 'Failed to load available slots.'); // Display error
        setSlots([]); // Ensure slots are empty on error
      } finally {
        setSlotsLoading(false); // Hide loading indicator
      }
    };

    loadSlots();
  }, [selectedDate, orderPincode, benCount, fetchAppointmentSlots]); // Dependencies for the effect

  // Handler for submitting the reschedule request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validation
    if (!selectedSlot) {
      setSubmitError("Please select a time slot.");
      return;
    }
    if (!reason.trim()) {
      setSubmitError("Please provide a reason for rescheduling.");
      return;
    }
    // Check if the reschedule function is available from context
    if (typeof rescheduleOrder !== 'function') {
        setSubmitError("Reschedule functionality is currently unavailable.");
        return;
    }

    setSubmitError('');     // Clear previous submission errors
    setSubmitLoading(true); // Show loading indicator on button

    // Format the date and time for the Thyrocare API ('YYYY-MM-DD HH:MM')
    const startTime = selectedSlot.slot.split(' - ')[0]; // Extract "HH:MM" from slot string like "15:30 - 16:00"
    const newAppointmentDateTime = `${selectedDate} ${startTime}`;

    try {
      console.log(`RescheduleModal: Submitting reschedule request for Order #${order.orderNo} to ${newAppointmentDateTime}`);
      // Call the context function (currently placeholder)
      await rescheduleOrder(order.orderNo, newAppointmentDateTime, reason);
      console.log("RescheduleModal: Reschedule request successful.");
      onSuccess(); // Call the onSuccess callback passed from AccountPage (e.g., to close modal and refresh orders)
    } catch (err) {
      console.error("RescheduleModal: Error submitting reschedule:", err);
      setSubmitError(err.message || "Failed to reschedule the order. Please try again."); // Display submission error
    } finally {
      setSubmitLoading(false); // Hide loading indicator on button
    }
  };

  return (
    // Use the generic Modal component for consistent styling
    <Modal onClose={onClose} showCloseButton={true}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Reschedule Order #{order.orderNo}
        </h2>

        {/* Display general submission errors here */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection Input */}
          <div>
            <label htmlFor="rescheduleDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select New Date *
            </label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                 <CalendarIcon size={16}/>
               </span>
               <input
                 type="date"
                 id="rescheduleDate"
                 value={selectedDate}
                 min={formatDate(tomorrow)} // Minimum date is tomorrow
                 max={formatDate(maxDate)}   // Maximum date is 7 days ahead
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                 required
                 disabled={submitLoading} // Disable while submitting final request
               />
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Time Slot *</label>
            {/* Loading Indicator */}
            {slotsLoading && (
              <div className="flex items-center justify-center text-sm text-gray-500 py-4 border rounded-md bg-gray-50">
                <Loader size={16} className="animate-spin mr-2"/>Loading available slots...
              </div>
            )}
            {/* Error Message */}
            {slotsError && !slotsLoading && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16}/>{slotsError}
              </div>
            )}
            {/* Slot List */}
            {!slotsLoading && !slotsError && slots.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 custom-scrollbar bg-white">
                {slots.map(slot => (
                  <button
                    type="button" // Prevent form submission on click
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    // Highlight the selected slot
                    className={`w-full text-left text-sm px-3 py-1.5 rounded transition-colors duration-150 disabled:opacity-50 ${
                      selectedSlot?.id === slot.id
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                    disabled={submitLoading} // Disable while submitting final request
                  >
                    {slot.slot}
                  </button>
                ))}
              </div>
            )}
            {/* No Slots Found Message */}
            {!slotsLoading && !slotsError && slots.length === 0 && (
                 <p className="text-sm text-gray-500 text-center py-4 border rounded-md bg-gray-50">No slots found for the selected date.</p>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="rescheduleReason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rescheduling *
            </label>
            <textarea
              id="rescheduleReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3} // Increased rows slightly
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Please provide a brief reason (e.g., Not available at scheduled time)"
              maxLength={100} // Set a reasonable limit
              required
              disabled={submitLoading} // Disable while submitting final request
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
             {/* Cancel Button */}
             <button
               type="button" // Important: prevents form submission
               onClick={onClose}
               disabled={submitLoading} // Disable while submitting
               className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
             >
               Cancel
             </button>
             {/* Confirm Button */}
             <button
              type="submit" // Submits the form
              disabled={submitLoading || !selectedSlot || slotsLoading} // Disable if loading, no slot selected, or slots are still loading
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[150px]" // Added min-width
            >
              {submitLoading ? <Loader size={16} className="animate-spin" /> : <Clock size={16} />}
              {submitLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RescheduleModal;