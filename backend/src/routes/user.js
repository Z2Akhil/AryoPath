import express from 'express';
import auth from '../middleware/auth.js';
import {apiRateLimit} from '../middleware/rateLimit.js';

const router = express.Router();

router.use(apiRateLimit);
router.use(auth);

router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to your dashboard!',
    user: {
      id: req.user._id,
      mobileNumber: req.user.mobileNumber
    },
    data: {
      stats: {
        visits: 150,
        messages: 25,
        notifications: 3
      }
    }
  });
});

export default router;
