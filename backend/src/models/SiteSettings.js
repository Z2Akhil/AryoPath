import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema({
  // --- Media Assets ---
  logo: {
    type: String, // URL or file path
    default: "/assets/default-logo.png",
  },
  heroImage: {
    type: String, // URL or file path
    default: "/assets/default-hero.jpg",
  },

  // --- Contact Info ---
  helplineNumber: {
    type: String,
    default: "+91-00000-00000",
  },
  email: {
    type: String,
    default: "support@example.com",
  },

  // --- Social Media Links ---
  socialMedia: {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
  },

  // --- Admin Info (who last updated) ---
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },

  // --- Timestamps ---
}, { timestamps: true });

export default mongoose.model("SiteSettings", siteSettingsSchema);
