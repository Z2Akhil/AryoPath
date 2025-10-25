// src/pages/AccountPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext'; // Get user and API functions
import { User, Edit3, FileText, ShoppingBag, Save, Phone, Lock, LogOut, Loader, Download, AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react'; // Icons
import ForgotPasswordForm from '../components/ForgotPasswordForm'; // Import the form for password change
import Modal from '../components/Modal'; // Import the generic Modal

const AccountPage = () => {
  // Get functions and state from UserContext
  const { user, updateProfile, fetchOrders, getReportDownloadLink, loading: userLoading } = useUser();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // --- Profile State ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Orders State ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true); // Start loading initially
  const [ordersError, setOrdersError] = useState('');

  // --- Reports State ---
  const [reportLoadingStates, setReportLoadingStates] = useState({}); // { reportKey: true/false }
  const [reportErrorStates, setReportErrorStates] = useState({}); // { reportKey: 'error msg' }

  const navigate = useNavigate(); // Hook for potential navigation

  // --- Effects ---

  // Initialize profile form fields when user data is available or changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  // Function to fetch orders (memoized with useCallback)
  const loadOrders = useCallback(async () => {
    if (user && fetchOrders) {
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const fetchedOrders = await fetchOrders();
        setOrders(fetchedOrders || []);
      } catch (err) {
        setOrdersError(err.message || 'Failed to load your orders.');
      } finally {
        setOrdersLoading(false);
      }
    } else if (!fetchOrders) {
        console.error("fetchOrders function is missing from UserContext");
        setOrdersError("Order fetching functionality not available.");
        setOrdersLoading(false);
    } else {
        setOrdersLoading(false); // Not logged in
    }
  }, [user, fetchOrders]);

  // Effect to fetch orders on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // --- Handlers ---

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileSuccess(''); setIsSavingProfile(true);
    try {
      if (!updateProfile) throw new Error("Update profile function not available.");
      const result = await updateProfile({ firstName, lastName });
      setProfileSuccess(result.message || 'Profile updated!');
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
     setFirstName(user?.firstName || ''); setLastName(user?.lastName || '');
     setIsEditingProfile(false); setProfileError(''); setProfileSuccess('');
  };

  const handleChangePasswordClick = () => {
     if (!user?.mobileNumber) return;
     setProfileError(''); setProfileSuccess('');
     setShowChangePasswordModal(true);
  };

  const handleDownloadReport = async (leadId, mobileNumber, orderNo) => {
     const reportKey = `${orderNo}_${leadId}`;
     if (!leadId || !mobileNumber) { /* ... error handling ... */ return; }
     if (!getReportDownloadLink) { /* ... error handling ... */ return; }
     setReportLoadingStates(prev => ({ ...prev, [reportKey]: true }));
     setReportErrorStates(prev => ({ ...prev, [reportKey]: '' }));
     try {
         const url = await getReportDownloadLink(leadId, mobileNumber, 'PDF');
         if (url) { window.open(url, '_blank', 'noopener,noreferrer'); }
         else { throw new Error('No report URL received.'); }
     } catch (err) {
         setReportErrorStates(prev => ({ ...prev, [reportKey]: err.message || 'Failed to get download link.' }));
     } finally {
         setReportLoadingStates(prev => ({ ...prev, [reportKey]: false }));
     }
  };

  const handleChangePasswordClose = () => {
    setShowChangePasswordModal(false);
  };

  // --- Render ---

  if (userLoading) {
      return (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
              <Loader className="animate-spin text-blue-600 h-10 w-10"/>
          </div>
      );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-gray-600">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p>Please log in to view your account details.</p>
      </div>
    );
  } // <-- End of the if(!user) block. Ensure no stray characters here.

  // Filter orders eligible for reports (Corrected Syntax Check)
  const reportableOrders = orders.filter(order => {
      const hasReportableStatus = order && (order.status === 'DONE' || order.status === 'REPORTED');
      const hasLeadId = order && order.benMaster && order.benMaster[0] && order.benMaster[0].id;
      return hasReportableStatus && hasLeadId;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-gray-50 min-h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* --- Column 1: Profile --- */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-100 self-start">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                 <User size={20} className="text-blue-600" /> My Profile
              </h2>
              {!isEditingProfile && ( <button onClick={() => setIsEditingProfile(true)} disabled={isSavingProfile} className="text-sm text-blue-600 hover:underline flex items-center gap-1 disabled:text-gray-400 disabled:no-underline"> <Edit3 size={14} /> Edit </button> )}
           </div>

           {profileError && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded border border-red-200">{profileError}</p>}
           {profileSuccess && <p className="text-green-600 text-sm mb-4 p-3 bg-green-50 rounded border border-green-200">{profileSuccess}</p>}

           {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                 {/* First Name */}
                 <div>
                    <label htmlFor="firstNameEdit" className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                    <input type="text" id="firstNameEdit" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isSavingProfile} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"/>
                  </div>
                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastNameEdit" className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                    <input type="text" id="lastNameEdit" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isSavingProfile} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"/>
                  </div>
                 {/* Phone (Read-Only) */}
                 <div className="relative">
                    <label htmlFor="mobileNumberEdit" className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                    <div className="flex items-center">
                        <span className="absolute left-3 top-[37px] text-gray-400"><Phone size={16}/></span>
                        <input type="text" id="mobileNumberEdit" value={user.mobileNumber} readOnly className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm"/>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed.</p>
                 </div>
                 {/* Save/Cancel Buttons */}
                 <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isSavingProfile} className={`flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed`}>
                      {isSavingProfile ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleProfileCancel} disabled={isSavingProfile} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium disabled:opacity-50"> Cancel </button>
                 </div>
              </form>
           ) : (
              <div className="space-y-3 text-sm">
                 <p className="text-gray-800"><span className="font-medium text-gray-500 w-16 inline-block">Name:</span> {firstName || lastName ? `${firstName} ${lastName}`.trim() : '(Name not provided)'}</p>
                 <p className="text-gray-800"><span className="font-medium text-gray-500 w-16 inline-block">Phone:</span> {user.mobileNumber}</p>
                 <button onClick={handleChangePasswordClick} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"> <Lock size={14} /> Change Password </button>
              </div>
           )}
        </div>

        {/* --- Column 2: Cart, Orders & Reports --- */}
        <div className="md:col-span-2 space-y-8">
           {/* Cart Link */}
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex justify-between items-center">
               <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2"> <ShoppingCart size={20} className="text-blue-600"/> My Cart </h2>
               <Link to="/cart" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"> View Cart </Link>
           </div>
           {/* Orders */}
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2"> <ShoppingBag size={20} className="text-blue-600"/> My Orders </h2>
               <button onClick={loadOrders} disabled={ordersLoading} className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1"> <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''}/> Refresh </button>
             </div>
             {ordersLoading && <div className="flex justify-center py-6"><Loader className="animate-spin text-blue-600 h-8 w-8"/></div>}
             {ordersError && <p className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">{ordersError}</p>}
             {!ordersLoading && !ordersError && (
               <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                 {orders.length > 0 ? (
                   orders.map(order => (
                     <div key={order.orderNo} className="border border-gray-100 p-4 rounded-md bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
                       <div className="flex-1 min-w-0"> {/* Added min-w-0 for flex truncation */}
                         <p className="font-semibold text-gray-800">Order #{order.orderNo}</p>
                         <p className="text-gray-500 text-xs">Date: {order.appointmentDate ? new Date(order.appointmentDate.split(' ')[0]).toLocaleDateString() : 'N/A'}</p>
                         <p className="text-gray-600 truncate" title={order.products}>Tests: {order.products || 'N/A'}</p>
                       </div>
                       <div className="flex items-center flex-wrap gap-x-4 gap-y-1 sm:flex-shrink-0"> {/* Prevent shrinking on small screens */}
                         <p className="text-gray-600 whitespace-nowrap">Status: <span className={`font-medium ${order.status === 'DONE' || order.status === 'REPORTED' ? 'text-green-600' : 'text-orange-500'}`}>{order.status || 'N/A'}</span></p>
                         <p className="font-bold text-gray-800 whitespace-nowrap">₹{order.rate || 'N/A'}</p>
                       </div>
                     </div>
                   ))
                 ) : ( <p className="text-gray-500 text-sm text-center py-4">You haven't placed any orders yet.</p> )}
               </div>
             )}
           </div>
           {/* Reports */}
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
             <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2"> <FileText size={20} className="text-blue-600"/> My Reports </h2>
              {ordersLoading && <div className="flex justify-center py-6"><Loader className="animate-spin text-blue-600 h-8 w-8"/></div>}
              {ordersError && <p className="text-red-500 text-sm">Could not load orders to check for reports.</p>}
              {!ordersLoading && !ordersError && (
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                   {reportableOrders.length > 0 ? (
                     reportableOrders.map(order => {
                        const leadId = order.benMaster?.[0]?.id;
                        const mobile = order.benMaster?.[0]?.mobile || user.mobileNumber;
                        const reportKey = `${order.orderNo}_${leadId}`;
                        const isLoading = reportLoadingStates[reportKey];
                        const errorMsg = reportErrorStates[reportKey];
                        return (
                         <div key={reportKey} className="border border-gray-100 p-3 rounded-md bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                           <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
                             <p className="font-medium text-gray-800 truncate" title={`${order.products || 'Report'} for Order #${order.orderNo}`}>{order.products || 'Report'} for Order #{order.orderNo}</p>
                             <p className="text-gray-500 text-xs">Date: {order.appointmentDate ? new Date(order.appointmentDate.split(' ')[0]).toLocaleDateString() : 'N/A'}</p>
                             {errorMsg && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errorMsg}</p>}
                           </div>
                           <button
                             onClick={() => handleDownloadReport(leadId, mobile, order.orderNo)}
                             disabled={!leadId || !mobile || isLoading}
                             className={`bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-xs font-medium flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[100px] justify-center flex-shrink-0`} // Added flex-shrink-0
                           >
                             {isLoading ? <Loader size={12} className="animate-spin" /> : <Download size={12} />} {isLoading ? 'Fetching...' : 'Download'}
                           </button>
                         </div>
                        );
                     })
                   ) : ( <p className="text-gray-500 text-sm text-center py-4">No reports available yet.</p> )}
                 </div>
             )}
           </div>
        </div>
      </div>

       {/* Render Change Password Modal (using ForgotPasswordForm) */}
       {showChangePasswordModal && (
         <Modal onClose={() => setShowChangePasswordModal(false)} showCloseButton={true}>
           <ForgotPasswordForm
             onClose={() => setShowChangePasswordModal(false)}
             onSwitchToLogin={handleChangePasswordClose} // Reuse prop conceptually
           />
         </Modal>
       )}
    </div>
  );
};

export default AccountPage;