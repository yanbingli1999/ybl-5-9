import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { ContrastAnalysis } from '../../shared/types.js';

const router = Router();
const ANALYSIS_DIR = fileService.getPath('analysis');

router.get('/:experimentId', async (req: Request, res: Response) => {
  try {
    const experimentId = req.params.experimentId;
    const allAnalysis = await fileService.listJsonFiles<ContrastAnalysis>(ANALYSIS_DIR, {
      sortBy: 'createdAt',
      order: 'desc'
    });
    
    const filtered = allAnalysis.filter(a => a.experimentId === experimentId);
    res.json({ success: true, data: filtered });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to load analysis records' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const analysis: ContrastAnalysis = req.body;
    const filePath = fileService.getPath('analysis', `${analysis.id}.json`);
    
    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Analysis ID already exists' });
    }
    
    await fileService.writeJsonFile(filePath, analysis);
    res.json({ success: true, data: analysis });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to create analysis record' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('analysis', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Analysis record not found' });
    }
    
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to delete analysis record' });
  }
});

export default router;
