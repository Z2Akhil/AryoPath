import express from "express";
import multer from "multer";
import SiteSettings from "../models/SiteSettings.js";

const router = express.Router();

// ✅ Multer Memory Storage (NO folder, NO local file)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ GET SETTINGS
router.get("/", async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ✅ UPDATE SETTINGS (files + text)
router.put(
  "/",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let settings = await SiteSettings.findOne();
      if (!settings) settings = await SiteSettings.create({});

      const updates = {};

      if (req.body.helplineNumber) updates.helplineNumber = req.body.helplineNumber;
      if (req.body.email) updates.email = req.body.email;

      if (req.body.socialMedia) {
        try {
          updates.socialMedia = JSON.parse(req.body.socialMedia);
        } catch {
          updates.socialMedia = req.body.socialMedia;
        }
      }

      // ✅ If image uploaded, convert to base64 and save
      if (req.files?.logo?.[0]) {
        updates.logo = `data:${req.files.logo[0].mimetype};base64,${req.files.logo[0].buffer.toString("base64")}`;
      }

      if (req.files?.heroImage?.[0]) {
        updates.heroImage = `data:${req.files.heroImage[0].mimetype};base64,${req.files.heroImage[0].buffer.toString("base64")}`;
      }

      const updated = await SiteSettings.findOneAndUpdate({}, updates, {
        new: true,
        upsert: true,
      });

      res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        data: updated,
      });
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  }
);

export default router;
