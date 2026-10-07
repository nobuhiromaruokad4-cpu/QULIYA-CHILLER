import express from 'express';
import path from 'path';
import { runSimulation, PRESETS } from '../src/server/physics';
import { SimulationParams } from '../src/types/simulation';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// 1. シミュレーション計算API (完全サーバーサイド実行)
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

// 4. 静的フロントエンド配信 (distフォルダ)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`QULIYA CHILLER シミュレーターが起動しました`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`NAS外部公開またはローカルLANからアクセス可能です`);
  console.log(`====================================================`);
});
