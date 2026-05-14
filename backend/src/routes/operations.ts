import { Router } from 'express';
import { getOperationsOverview, saveOperationsOverview } from '../controllers/operationsController';
import { requireOperationsAccess } from '../middleware/roleMiddleware';

const router = Router();

router.get('/overview', requireOperationsAccess, getOperationsOverview);
router.put('/overview', requireOperationsAccess, saveOperationsOverview);

export default router;
