import { Router } from 'express';
import { getMonthlyAnalytics, getSummary, getYearlyAnalytics } from '../controllers/analyticsController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/summary', getSummary);
router.get('/monthly', requireRole('admin', 'doctor'), getMonthlyAnalytics);
router.get('/yearly', requireRole('admin', 'doctor'), getYearlyAnalytics);

export default router;
