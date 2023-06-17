import { Router } from 'express';
import cors from 'cors';
import { searchGameCategories, getGameBoxArt } from '../../db.js';

const router = Router();

const corsOptions = {
  origin: 'http://localhost',
};

router.use(cors(corsOptions));

router.post('/', async (req, res) => {
  if (!req.body.category) {
    res.status(400).send('Missing category');
    return;
  }
  if (req.body.boxArt) {
    const boxArt = await getGameBoxArt(req.body.category)
    res.json(boxArt);
    return;
  } else {
    try {
      const categories = await searchGameCategories(req.body.category);
      res.json(categories);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Server error');
    }
  }
});

export default router;