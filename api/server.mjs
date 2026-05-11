import cors from 'cors';
import express from 'express';

const app = express();
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  })
);

function tokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const q = req.query.token;
  if (typeof q === 'string' && q.trim()) return q.trim();
  return '';
}

function isTokenActive(token) {
  if (!token) return false;
  const test = process.env.TEST_ACCESS_TOKEN || 'motorista-teste';
  if (token === test) return true;
  const list = (process.env.VALID_ACCESS_TOKENS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(token);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const token = tokenFromRequest(req);
  const active = isTokenActive(token);
  res.json({ active, plan: active ? 'mensal' : null });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`API ouvindo em http://0.0.0.0:${port}`);
});
