import { Router } from 'express';
import { deleteUser, getMe, getUsers, updateUserRole } from '../controllers/userController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/me', getMe);
router.get('/', requireRole('admin'), getUsers);
router.put('/:id/role', requireRole('admin'), updateUserRole);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
