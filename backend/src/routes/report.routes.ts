import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Protected endpoints
router.use(authMiddleware as any);

router.get('/', ReportController.listReports as any);
router.get('/:id', ReportController.downloadPdfReport as any);
router.post('/:id', ReportController.downloadPdfReport as any);

export default router;
