import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createAssignment,
  getAllAssignments,
  getAssignment,
  regenerateAssignment,
} from '../controllers/assignmentController.js';
import { generatePDF } from '../controllers/pdfController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

router.post('/', upload.single('file'), createAssignment);
router.get('/', getAllAssignments);
router.get('/:id', getAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/:id/pdf', generatePDF);

export default router;
