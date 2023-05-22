import { Router } from 'express';

const router = Router();

export default function (app) {
    router.get('/upload-status', (req, res) => {
        res.json(uploadStatus);
      });
}
