import express from 'express';
import { getAirlines, addAirline, updateAirline, deleteAirline } from '../controllers/airlineController.js';
import { uploadAirlineLogo } from '../middleware/uploadAirlineLogo.js';
import { requireAdmin } from '../src/apis/middleware/isAdmin.middleware.js';

const router = express.Router();

router.get('/', getAirlines);
// Create with optional file uploads (logo, tailLogo)
router.post('/', requireAdmin, (req, res, next) => {
	uploadAirlineLogo(req, res, function(err){
		if (err) return res.status(400).json({ success:false, message: err.message });
		next();
	});
}, addAirline);
router.put('/:id', requireAdmin, updateAirline);
router.delete('/:id', requireAdmin, deleteAirline);

export default router;
