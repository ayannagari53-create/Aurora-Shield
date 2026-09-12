import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// Protected endpoints
router.use(authMiddleware);
router.get('/', ReportController.listReports);
router.get('/:id', ReportController.downloadPdfReport);
router.post('/:id', ReportController.downloadPdfReport);
export default router;
