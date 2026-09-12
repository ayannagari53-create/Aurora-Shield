import { Router } from 'express';
const router = Router();
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'aurora-shield-backend',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});
export default router;
