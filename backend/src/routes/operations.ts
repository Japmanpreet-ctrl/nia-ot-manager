import { Router } from 'express';
import { getOperationsOverview, saveOperationsOverview } from '../controllers/operationsController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/overview', requireRole('admin', 'doctor', 'nurse', 'data_entry'), getOperationsOverview);
router.put('/overview', requireRole('admin', 'doctor', 'nurse', 'data_entry'), saveOperationsOverview);

export default router;
