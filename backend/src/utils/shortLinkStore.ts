// shortLinkStore.ts
import ShortLink from '../models/shortLink'; // adjust path
import crypto from 'crypto';

const DEFAULT_LEN = 8;
function randomCode(len = DEFAULT_LEN) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4)).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, len);
}

export async function createShortCode(fullUrl: string, len = DEFAULT_LEN, ttlSeconds?: number) {
  if (!fullUrl) throw new Error('fullUrl required');
  for (let i = 0; i < 6; i++) {
    const code = randomCode(len);
    try {
      const rec: any = await ShortLink.create({ code, fullUrl, expiresAt: ttlSeconds ? new Date(Date.now()+ttlSeconds*1000) : null });
      return rec.code;
    } catch (err: any) {
      const isDup = err?.name === 'SequelizeUniqueConstraintError' || (err?.parent && err.parent.code === 'ER_DUP_ENTRY');
      if (isDup) continue;
      throw err;
    }
  }
  throw new Error('Failed to create short code');
}

export async function resolveShortCode(code: string) {
  if (!code) return null;
  const rec: any = await ShortLink.findOne({ where: { code } });
  if (!rec) return null;
  if (rec.expiresAt && new Date(rec.expiresAt) < new Date()) { await rec.destroy().catch(()=>{}); return null; }
  return rec.fullUrl;
}
