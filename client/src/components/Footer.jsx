import siteSettings from "../api/siteSettingsApi.jsx";
import { Phone, Mail, Clock, MapPin } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import{useState,useEffect} from "react";

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await siteSettings(); 
      setSettings(data);
      setLoading(false);
    };
    fetchData(); 
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!settings) return <p>Failed to load settings</p>;

  const { logo, heroImage, email, helplineNumber, socialMedia } = settings;
  console.log(settings);
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="./logo.jpg"
                  alt="Company Logo"
                  className="w-10 h-10 object-contain rounded-full"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">AryoPath</h3>
                <p className="text-xs text-gray-400">In association with ThyroCare</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner for comprehensive health diagnostics and lab services.
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
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/" className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2">
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

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Our Services</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                Home Sample Collection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                Online Reports
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                Doctor Consultation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                Health Packages
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                24/7 Support
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href={`mailto:${email}`} className="hover:text-blue-400 transition-colors">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href={`tel:${helplineNumber}`} className="hover:text-blue-400 transition-colors">
                  {helplineNumber}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>24/7 Available</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
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
              <p>&copy; 2024 AryoPath. All rights reserved. | In association with ThyroCare</p>
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
