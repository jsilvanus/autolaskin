import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../data/calculations.json');
const PIN_RE = /^\d{6,8}$/;
const app = express();
app.use(express.json());
function isValidPin(pin) {
    return PIN_RE.test(pin);
}
async function readStorage() {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return { version: 1, calculations: {} };
    }
}
async function writeStorage(data) {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmp, DATA_FILE);
}
// GET /api/v1/calculations/:pin
app.get('/api/v1/calculations/:pin', async (req, res) => {
    const { pin } = req.params;
    if (!isValidPin(pin)) {
        res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' });
        return;
    }
    const storage = await readStorage();
    const entry = storage.calculations[pin];
    if (!entry) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json(entry);
});
// PUT /api/v1/calculations/:pin
app.put('/api/v1/calculations/:pin', async (req, res) => {
    const { pin } = req.params;
    if (!isValidPin(pin)) {
        res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' });
        return;
    }
    const body = req.body;
    const storage = await readStorage();
    const existing = storage.calculations[pin];
    const now = new Date().toISOString();
    const entry = {
        name: body.name ?? existing?.name ?? pin,
        data: body,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
    };
    storage.calculations[pin] = entry;
    await writeStorage(storage);
    res.status(200).json(entry);
});
// DELETE /api/v1/calculations/:pin/data
app.delete('/api/v1/calculations/:pin/data', async (req, res) => {
    const { pin } = req.params;
    if (!isValidPin(pin)) {
        res.status(400).json({ error: 'Invalid PIN. Must be 6-8 digits.' });
        return;
    }
    const storage = await readStorage();
    const existing = storage.calculations[pin];
    if (!existing) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    const now = new Date().toISOString();
    storage.calculations[pin] = {
        ...existing,
        data: null,
        updatedAt: now,
    };
    await writeStorage(storage);
    res.json({ message: 'Data cleared', pin });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});
const PORT = process.env['PORT'] ? parseInt(process.env['PORT']) : 3001;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
export default app;
//# sourceMappingURL=index.js.map