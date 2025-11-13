import multer from 'multer';
import path from 'path';
import fs from 'fs';

const airlinesDir = path.join(process.cwd(), 'backend', 'uploads', 'airlines');
if (!fs.existsSync(airlinesDir)) {
  fs.mkdirSync(airlinesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, airlinesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g,'');
    cb(null, base + '-' + Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (/image\/(png|jpeg|jpg|svg\+xml)/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files allowed (png,jpg,jpeg,svg)'));
};

export const uploadAirlineLogo = multer({ storage, fileFilter }).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'tailLogo', maxCount: 1 }
]);
