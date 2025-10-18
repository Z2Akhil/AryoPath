import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-lg font-semibold">Diagnostic Centres</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering people to improve their lives through quality healthcare services
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover-elevate rounded-full p-2">
                <Facebook className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate rounded-full p-2">
                <Twitter className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate rounded-full p-2">
                <Instagram className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="#" className="hover-elevate rounded-full p-2">
                <Linkedin className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tests" className="text-muted-foreground hover:text-foreground">
                  All Tests
                </Link>
              </li>
              <li>
                <Link href="/profiles" className="text-muted-foreground hover:text-foreground">
                  Health Profiles
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-muted-foreground hover:text-foreground">
                  Special Offers
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Our Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Home Sample Collection</li>
              <li className="text-muted-foreground">Online Reports</li>
              <li className="text-muted-foreground">Doctor Consultation</li>
              <li className="text-muted-foreground">Health Packages</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@diagnosticcentres.com</li>
              <li>Phone: 1800-123-4567</li>
              <li>Timing: 24/7 Available</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Diagnostic Centres. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
