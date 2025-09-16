import express from 'express';
import { convertGLBToSTL, getConversionStatus } from '../controllers/conversionController.js';

const router = express.Router();

// GLB to STL conversion endpoint
router.post('/glb-to-stl', convertGLBToSTL);

// Get conversion status
router.get('/status/:conversion_id', getConversionStatus);

export default router;
