import { useState } from "react";
import { Phone, Mail, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Footer() {
  const { settings, loading, error } = useSiteSettings();
  const [openSection, setOpenSection] = useState(null);
  const [imgError,setImgError]=useState(false);
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (loading) return <p className="text-center py-8 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center py-8 text-red-500">Failed to load settings</p>;
  if (!settings) return <p className="text-center py-8 text-gray-500">No settings available</p>;

  const {logo, email, helplineNumber, socialMedia } = settings;

   const logoImage = !imgError && settings?.logo ? settings.logo : "./logo.jpg";
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logoImage}
                alt="Company Logo"
                onError={() => setImgError(true)}
                className="w-10 h-10 object-contain rounded-full"
              />
              <div>
                <h3 className="text-xl font-bold">AryoPath</h3>
                <p className="text-xs text-gray-400">
                  In association with ThyroCare
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner for comprehensive health diagnostics and lab
              services.
            </p>
            <div className="flex space-x-3">
              <a href={socialMedia.facebook} className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors">
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a href={socialMedia.twitter} className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors">
                <FaTwitter className="w-4 h-4" />
              </a>
              <a href={socialMedia.instagram} className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href={socialMedia.linkedin} className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors">
                <FaLinkedinIn className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <button
              onClick={() => toggleSection("links")}
              className="w-full flex justify-between items-center md:cursor-default md:pointer-events-none"
            >
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <span className="md:hidden">
                {openSection === "links" ? <ChevronUp /> : <ChevronDown />}
              </span>
            </button>

            <ul
              className={`overflow-hidden transition-all duration-300 md:block ${
                openSection === "links" ? "max-h-96 mt-3" : "max-h-0 md:max-h-none"
              }`}
            >
              <li>
                <a href="/" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 mt-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  Home
                </a>
              </li>
              <li>
                <a href="/packages" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  Popular Packages
                </a>
              </li>
              <li>
                <a href="/tests" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  All Tests
                </a>
              </li>
              <li>
                <a href="/offers" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  Special Offers
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <button
              onClick={() => toggleSection("services")}
              className="w-full flex justify-between items-center md:cursor-default md:pointer-events-none"
            >
              <h4 className="text-lg font-semibold text-white">Our Services</h4>
              <span className="md:hidden">
                {openSection === "services" ? <ChevronUp /> : <ChevronDown />}
              </span>
            </button>

            <ul
              className={`overflow-hidden transition-all duration-300 md:block ${
                openSection === "services" ? "max-h-96 mt-3" : "max-h-0 md:max-h-none"
              }`}
            >
              {[
                "Home Sample Collection",
                "Online Reports",
                "Doctor Consultation",
                "Health Packages",
                "24/7 Support",
              ].map((service, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300 mt-2">
                  <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <button
              onClick={() => toggleSection("contact")}
              className="w-full flex justify-between items-center md:cursor-default md:pointer-events-none"
            >
              <h4 className="text-lg font-semibold text-white">Contact Us</h4>
              <span className="md:hidden">
                {openSection === "contact" ? <ChevronUp /> : <ChevronDown />}
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 md:block ${
                openSection === "contact" ? "max-h-96 mt-3" : "max-h-0 md:max-h-none"
              }`}
            >
              <div className="flex items-center gap-3 text-gray-300 text-sm mt-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href={`mailto:${email}`} className="hover:text-blue-400 transition-colors">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href={`tel:${helplineNumber}`} className="hover:text-blue-400 transition-colors">
                  {helplineNumber}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>24/7 Available</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Pan India Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              <p>
                &copy; {new Date().getFullYear()} AryoPath. All rights reserved. |
                In association with ThyroCare
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
