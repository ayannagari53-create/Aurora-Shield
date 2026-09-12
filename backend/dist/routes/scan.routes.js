import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
const router = Router();
// Protected endpoints
router.use(authMiddleware);
router.post('/', ScanController.createScan);
router.post('/:id/images', uploadMiddleware.array('images', 8), ScanController.uploadImages);
router.post('/:id/ocr', ScanController.runOcr);
router.post('/:id/analyze', ScanController.analyzeScan);
router.post('/:id/verify', ScanController.verifyScan);
router.post('/:id/compliance', ScanController.getCompliance);
router.get('/', ScanController.listScans);
router.get('/:id', ScanController.getScan);
router.delete('/:id', ScanController.deleteScan);
export default router;
