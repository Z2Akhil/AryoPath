import React, { useState } from "react";
import { axiosInstance } from '../api/axiosInstance';
import {
  Mail,
  Phone,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  Image,
  X,
} from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
export default function SettingsPage() {
  const [form, setForm] = useState({
    helplineNumber: "",
    email: "",
    logo: null,
    heroImage: null,
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
  });

  const [previews, setPreviews] = useState({ logo: "", heroImage: "" });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [name]: value },
    }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, [name]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: null }));
    setPreviews((prev) => ({ ...prev, [fieldName]: "" }));
    const fileInput = document.getElementById(fieldName);
    if (fileInput) fileInput.value = "";
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Step 1: Validate that at least one field has data
      const hasData =
        form.helplineNumber.trim() ||
        form.email.trim() ||
        form.logo ||
        form.heroImage ||
        Object.values(form.socialMedia).some((link) => link.trim() !== "");

      if (!hasData) {
        showNotification("error", "No data filled! Please fill in at least one field.");
        setLoading(false);
        return;
      }

      // ✅ Step 2: Create FormData
      const formData = new FormData();

      if (form.helplineNumber.trim())
        formData.append("helplineNumber", form.helplineNumber);

      if (form.email.trim())
        formData.append("email", form.email);

      if (form.logo)
        formData.append("logo", form.logo);

      if (form.heroImage)
        formData.append("heroImage", form.heroImage);

      if (Object.values(form.socialMedia).some((link) => link.trim() !== "")) {
        formData.append("socialMedia", JSON.stringify(form.socialMedia));
      }

      // ✅ Step 3: Send PUT request using axiosInstance
      const response = await axiosInstance.put("/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // ✅ Step 4: Handle success response
      if (response.status === 200) {
        showNotification("success", "Settings updated successfully!");
      } else {
        showNotification("error", response.data?.message || "Update failed.");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      showNotification("error", "Failed to update settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 relative">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Manage contact info, brand images, and social links
        </h2>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" /> Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Helpline Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="helplineNumber"
                  value={form.helplineNumber}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="support@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Brand Images */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-500" /> Brand Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Logo</label>
              {!previews.logo ? (
                <label
                  htmlFor="logo"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 text-gray-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                >
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-sm">Upload Logo</span>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <div className="h-32 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                    <img src={previews.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                  </div>
                  <button
                    onClick={() => handleRemoveImage("logo")}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Hero Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Hero Image</label>
              {!previews.heroImage ? (
                <label
                  htmlFor="heroImage"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 text-gray-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                >
                  <Image className="w-5 h-5 mb-1" />
                  <span className="text-sm">Upload Hero Image</span>
                  <input
                    type="file"
                    id="heroImage"
                    name="heroImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <div className="h-32 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                    <img src={previews.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => handleRemoveImage("heroImage")}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
                    title="Remove hero image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaFacebookF className="w-4 h-4 text-blue-500" /> Social Media Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "facebook", Icon: FaFacebookF, color: "text-blue-600", placeholder: "https://facebook.com/yourpage" },
              { name: "twitter", Icon: FaTwitter, color: "text-sky-500", placeholder: "https://twitter.com/yourhandle" },
              { name: "instagram", Icon: FaInstagram, color: "text-pink-600", placeholder: "https://instagram.com/yourprofile" },
              { name: "linkedin", Icon: FaLinkedinIn, color: "text-blue-700", placeholder: "https://linkedin.com/company/yourcompany" },
            ].map(({ name, Icon, color, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{name}</label>
                <div className="relative">
                  <Icon className={`absolute left-3 top-2.5 w-4 h-4 ${color}`} />
                  <input
                    type="url"
                    name={name}
                    value={form.socialMedia[name]}
                    onChange={handleSocialChange}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end relative">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 transition ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Saving..." : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </span>
            )}
          </button>

          {/* Toast Notification */}
          {notification.show && (
            <div
              className={`absolute bottom-14 right-0 px-4 py-2.5 flex items-center gap-2 rounded-lg shadow-md text-sm animate-fade-in-up ${notification.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
                }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{notification.message}</span>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.25s ease-out;
          }
        `}
      </style>
    </div>
  );
}