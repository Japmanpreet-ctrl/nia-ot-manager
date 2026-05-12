import { Router } from 'express';
import { createRecord, deleteRecord, getRecordById, getRecords, updateRecord } from '../controllers/recordController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', getRecords);
router.get('/:id', getRecordById);
router.post('/', requireRole('admin', 'doctor', 'nurse', 'data_entry'), createRecord);
router.put('/:id', requireRole('admin', 'doctor'), updateRecord);
router.delete('/:id', requireRole('admin'), deleteRecord);

export default router;
