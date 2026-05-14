import { Router } from 'express';
import {
  getLinenItems,
  createLinenItem,
  updateLinenItem,
  deleteLinenItem,
  getLinenStats,
  getLaundryLogs,
  createLaundryLog,
  updateLaundryLog,
  getLinenAuditLogs,
} from '../controllers/linenController';
import { requireInventoryAccess } from '../middleware/roleMiddleware';

const router = Router();

// All routes require inventory access (admin, doctor, nurse, data_entry)
router.get('/stats', requireInventoryAccess, getLinenStats);
router.get('/items', requireInventoryAccess, getLinenItems);
router.post('/items', requireInventoryAccess, createLinenItem);
router.put('/items/:id', requireInventoryAccess, updateLinenItem);
router.delete('/items/:id', requireInventoryAccess, deleteLinenItem);
router.get('/laundry', requireInventoryAccess, getLaundryLogs);
router.post('/laundry', requireInventoryAccess, createLaundryLog);
router.put('/laundry/:id', requireInventoryAccess, updateLaundryLog);
router.get('/audit', requireInventoryAccess, getLinenAuditLogs);

export default router;
