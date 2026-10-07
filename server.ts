import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { runSimulation, PRESETS } from './src/server/physics';
import { SimulationParams } from './src/types/simulation';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

const DIAGRAM_STORAGE_PATH = path.join(process.cwd(), 'uploaded_diagram.dat');

// サーバー保存型 図面画像API (誰が見ても同じ画像を表示できるようにする)
app.get('/api/diagram-image', (_req, res) => {
  try {
    if (fs.existsSync(DIAGRAM_STORAGE_PATH)) {
      const data = fs.readFileSync(DIAGRAM_STORAGE_PATH, 'utf-8');
      return res.json({ image: data });
    }
    return res.json({ image: null });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/diagram-image', (req, res) => {
  try {
    const { image } = req.body;
    if (image) {
      fs.writeFileSync(DIAGRAM_STORAGE_PATH, image, 'utf-8');
    } else {
      if (fs.existsSync(DIAGRAM_STORAGE_PATH)) {
        fs.unlinkSync(DIAGRAM_STORAGE_PATH);
      }
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 1. シミュレーション計算API (完全サーバーサイド実行)
// 伝熱工学ロジック、RK4数値積分、Nu/Re数式、経験定数はすべてサーバーメモリ内で処理され、フロントには計算結果のみ返却されます。
app.post('/api/simulate', (req, res) => {
  try {
    const { params, caseId, colorIndex } = req.body as {
      params: SimulationParams;
      caseId?: string;
      colorIndex?: number;
    };

    if (!params) {
      return res.status(400).json({ error: 'Parameters are required' });
    }

    const result = runSimulation(params, caseId, colorIndex ?? 0);
    return res.json(result);
  } catch (error: any) {
    console.error('Simulation error:', error);
    return res.status(500).json({ error: error.message || 'Simulation failed' });
  }
});

// 2. 3方式同時計算API (/api/simulate-3modes)
app.post('/api/simulate-3modes', (req, res) => {
  try {
    const { params } = req.body as { params: SimulationParams };
    if (!params) {
      return res.status(400).json({ error: 'Parameters are required' });
    }

    const rotaryParams: SimulationParams = { ...params, chillerType: 'rotary' };
    const coilParams: SimulationParams = { ...params, chillerType: 'coil' };
    const sinkParams: SimulationParams = { ...params, chillerType: 'sink' };

    const rotaryRes = runSimulation(rotaryParams, '3m_rotary', 0);
    const coilRes = runSimulation(coilParams, '3m_coil', 1);
    const sinkRes = runSimulation(sinkParams, '3m_sink', 2);

    return res.json({
      rotary: rotaryRes,
      coil: coilRes,
      sink: sinkRes,
    });
  } catch (error: any) {
    console.error('3-Modes Simulation error:', error);
    return res.status(500).json({ error: error.message || '3-Modes simulation failed' });
  }
});

// 3. プリセット一覧API (/api/presets)
app.get('/api/presets', (_req, res) => {
  res.json(PRESETS);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running securely on http://0.0.0.0:${PORT}`);
  });
}

startServer();
