import multer from 'multer';
import { config } from '../config/env.js';
// In-memory buffer storage for safe processing without persistent disk pollution
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: config.maxUploadSizeBytes,
        files: 8
    },
    fileFilter: (req, file, cb) => {
        if (config.allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file format "${file.mimetype}". Only JPEG, PNG, WebP and AVIF images are permitted.`));
        }
    }
});
