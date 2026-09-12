import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

// Protected endpoints
router.use(authMiddleware as any);

router.post('/', ScanController.createScan as any);
router.post('/:id/images', uploadMiddleware.array('images', 8), ScanController.uploadImages as any);
router.post('/:id/ocr', ScanController.runOcr as any);
router.post('/:id/analyze', ScanController.analyzeScan as any);
router.post('/:id/verify', ScanController.verifyScan as any);
router.post('/:id/compliance', ScanController.getCompliance as any);

router.get('/', ScanController.listScans as any);
router.get('/:id', ScanController.getScan as any);
router.delete('/:id', ScanController.deleteScan as any);

export default router;
