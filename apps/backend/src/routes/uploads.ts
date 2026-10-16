import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireStaffAuth, getStaffSecretToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_BASE = path.resolve(__dirname, '../../uploads');
const RAW_DIR = path.join(UPLOADS_BASE, 'raw');
const SAFE_DIR = path.join(UPLOADS_BASE, 'safe');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(SAFE_DIR)) fs.mkdirSync(SAFE_DIR, { recursive: true });

// Multer storage: strictly to private raw directory
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RAW_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only JPEG, PNG, and WEBP image uploads are accepted.'));
    }
  },
});

export const uploadsRouter = Router();

/**
 * POST /api/uploads
 * Citizen media upload. Saves to private raw storage, returns safe reference.
 */
uploadsRouter.post('/', (req: Request, res: Response) => {
  upload.single('media')(req, res, (err: any) => {
    if (err) {
      if (err.message?.includes('INVALID_FILE_TYPE')) {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: err.message,
        });
      }
      return res.status(400).json({
        error: 'UPLOAD_ERROR',
        message: err.message || 'File upload failed.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE_UPLOADED',
        message: 'Please provide an image file in the "media" field.',
      });
    }

    const filename = req.file.filename;
    const mediaRef = `uploads/${filename}`;
    const safeMediaRef = `safe/${filename}`;

    // Citizen upload remains isolated in RAW_DIR.
    // Real face/license-plate visual anonymization must be performed before placing in SAFE_DIR.
    // Unredacted citizen photos are NOT copied to safe storage.

    return res.status(201).json({
      message: 'File uploaded safely. Raw bytes isolated; safe media reference generated.',
      media_ref: mediaRef,
      safe_reference: safeMediaRef,
      filename,
      original_name: req.file.originalname,
      size_bytes: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

/**
 * GET /api/uploads/safe/:filename
 * Serves verified anonymized media.
 * If face/license-plate visual anonymization is unavailable, public exposure is strictly BLOCKED.
 */
uploadsRouter.get('/safe/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const isAnonymizationAvailable = process.env.VISUAL_ANONYMIZATION_ACTIVE === 'true';
  const safePath = path.join(SAFE_DIR, path.basename(filename));

  // If automated visual face/plate anonymization is verified and safe file exists
  if (isAnonymizationAvailable && fs.existsSync(safePath)) {
    return res.sendFile(safePath);
  }

  // If accessed by authenticated municipal staff, allow inspection of confidential image
  const authHeader = req.headers['authorization'];
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;

  if (token && token === getStaffSecretToken()) {
    const rawPath = path.join(RAW_DIR, path.basename(filename));
    if (fs.existsSync(rawPath)) {
      return res.sendFile(rawPath);
    }
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Media not found.' });
  }

  // Without verified visual face/license-plate anonymization, public access is BLOCKED
  return res.status(403).json({
    error: 'VISUAL_ANONYMIZATION_UNAVAILABLE',
    message:
      'Public access is restricted. Certified face and license-plate visual anonymization is unavailable in this environment; raw media is shielded from public exposure.',
    privacy_policy:
      'Citizen Privacy Guarantee: Raw evidence is never exposed publicly without certified face and license-plate redaction.',
  });
});

/**
 * GET /api/uploads/raw/:filename
 * PROTECTED: Raw images are strictly confidential and NEVER publicly exposed.
 * Requires municipal staff authentication.
 */
uploadsRouter.get('/raw/:filename', requireStaffAuth, (req: Request, res: Response) => {
  const { filename } = req.params;
  const rawPath = path.join(RAW_DIR, path.basename(filename));

  if (!fs.existsSync(rawPath)) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Raw media not found.' });
  }

  return res.sendFile(rawPath);
});
