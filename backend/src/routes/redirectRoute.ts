import express, { Request, Response } from 'express';
import { resolveShortCode } from '../utils/shortLinkStore';

const router = express.Router();

/**
 * NEW: handle the DLT / CTA style URL:
 *   https://gracecabs.com/r/?l=CODE
 */
router.get('/r', async (req: Request, res: Response) => {
  const code = (req.query.l as string | undefined)?.trim();
  console.log('REDIRECT HIT (query) code=', code, 'ip=', req.ip);

  if (!code) {
    return res.status(400).send('Missing short code');
  }

  try {
    const full = await resolveShortCode(code);
    console.log('Resolved full URL:', full);
    if (!full) {
      return res.status(404).send('Short link not found or expired');
    }
    return res.redirect(302, full);
  } catch (err) {
    console.error('Redirect error', err);
    return res.status(500).send('Internal server error');
  }
});

/**
 * OLD style fallback:
 *   https://gracecabs.com/r/CODE
 * (kept for compatibility, optional)
 */
router.get('/r/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  console.log('REDIRECT HIT (param) code=', code, 'ip=', req.ip);
  try {
    const full = await resolveShortCode(code);
    console.log('Resolved full URL:', full);
    if (!full) {
      return res.status(404).send('Short link not found or expired');
    }
    return res.redirect(302, full);
  } catch (err) {
    console.error('Redirect error', err);
    return res.status(500).send('Internal server error');
  }
});

export default router;
