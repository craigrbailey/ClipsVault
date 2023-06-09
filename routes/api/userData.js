import { Router } from 'express';
import { retrieveUserData } from '../../db.js';

const router = Router();

router.get('/', async (req, res) => {
    const userData = await retrieveUserData();
    res.json({ userData });
});

export default router;