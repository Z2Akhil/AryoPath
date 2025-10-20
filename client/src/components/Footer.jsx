import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-100 text-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <span className="text-lg font-semibold">Diagnostic Centres</span>
            </div>
            <p className="text-sm text-gray-600">
              Empowering people to improve their lives through quality healthcare services.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:bg-gray-200 rounded-full p-2">
                <Facebook className="h-5 w-5 text-gray-600" />
              </a>
              <a href="#" className="hover:bg-gray-200 rounded-full p-2">
                <Twitter className="h-5 w-5 text-gray-600" />
              </a>
              <a href="#" className="hover:bg-gray-200 rounded-full p-2">
                <Instagram className="h-5 w-5 text-gray-600" />
              </a>
              <a href="#" className="hover:bg-gray-200 rounded-full p-2">
                <Linkedin className="h-5 w-5 text-gray-600" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/tests" className="text-gray-600 hover:text-gray-900">All Tests</a></li>
              <li><a href="/profiles" className="text-gray-600 hover:text-gray-900">Health Profiles</a></li>
              <li><a href="/offers" className="text-gray-600 hover:text-gray-900">Special Offers</a></li>
              <li><a href="/about" className="text-gray-600 hover:text-gray-900">About Us</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Our Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Home Sample Collection</li>
              <li>Online Reports</li>
              <li>Doctor Consultation</li>
              <li>Health Packages</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: support@diagnosticcentres.com</li>
              <li>Phone: 1800-123-4567</li>
              <li>Timing: 24/7 Available</li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Diagnostic Centres. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
