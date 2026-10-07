import React, { useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { SimulationResult } from '../types/simulation';

interface MetricCardsProps {
  result: SimulationResult | null;
  threeModesData?: {
    rotary: SimulationResult;
    coil: SimulationResult;
    sink: SimulationResult;
  } | null;
}

interface ModeResult {
  modeName: 'QULIYA式' | 'コイル式' | 'シンク式';
  key: 'rotary' | 'coil' | 'sink';
  time: number | null;
  waterL: number | null;
  costYen: number | null;
  ratioStr: string;
  isActive: boolean;
}

// 既約分数ヘルパー (シンク式を1とした分数表現 例: 1/7, 2/3, 1/1)
function formatRatioToSink(time: number | null, sinkTime: number | null): string {
  if (time === null || sinkTime === null || sinkTime <= 0) return '-';
  const ratio = time / sinkTime;
  if (ratio >= 0.95 && ratio <= 1.05) return '1/1';

  const commonFractions = [
    { num: 1, den: 10, val: 1 / 10, str: '1/10' },
    { num: 1, den: 9, val: 1 / 9, str: '1/9' },
    { num: 1, den: 8, val: 1 / 8, str: '1/8' },
    { num: 1, den: 7, val: 1 / 7, str: '1/7' },
    { num: 1, den: 6, val: 1 / 6, str: '1/6' },
    { num: 1, den: 5, val: 1 / 5, str: '1/5' },
    { num: 1, den: 4, val: 1 / 4, str: '1/4' },
    { num: 1, den: 3, val: 1 / 3, str: '1/3' },
    { num: 2, den: 5, val: 2 / 5, str: '2/5' },
    { num: 1, den: 2, val: 1 / 2, str: '1/2' },
    { num: 3, den: 5, val: 3 / 5, str: '3/5' },
    { num: 2, den: 3, val: 2 / 3, str: '2/3' },
    { num: 3, den: 4, val: 3 / 4, str: '3/4' },
    { num: 4, den: 5, val: 4 / 5, str: '4/5' },
    { num: 5, den: 6, val: 5 / 6, str: '5/6' },
    { num: 1, den: 1, val: 1, str: '1/1' },
  ];

  let best = commonFractions[0];
  let minDiff = Math.abs(ratio - best.val);
  for (const f of commonFractions) {
    const diff = Math.abs(ratio - f.val);
    if (diff < minDiff) {
      minDiff = diff;
      best = f;
    }
  }

  if (minDiff <= 0.08) {
    return best.str;
  }
  const approxDen = Math.round(1 / ratio);
  if (approxDen > 1 && approxDen <= 20) {
    return `1/${approxDen}`;
  }
  return `${ratio.toFixed(2)}`;
}

// 3方式比較のグラフ色と完全に一致させたスタイル設定
// 回転式: #0891b2 (Cyan-600)
// コイル式: #f59e0b (Amber-500)
// シンク式: #059669 (Emerald-600)
const MODE_STYLES = {
  rotary: {
    textColor: 'text-cyan-700',
    dotColor: 'bg-cyan-600',
    timeColor: 'text-cyan-900',
    badge: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
    activeBg: 'bg-cyan-50/90 border border-cyan-300 font-bold shadow-2xs',
    inactiveBg: 'bg-white/90 border border-transparent hover:bg-slate-50',
  },
  coil: {
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
    timeColor: 'text-amber-900',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200',
    activeBg: 'bg-amber-50/90 border border-amber-300 font-bold shadow-2xs',
    inactiveBg: 'bg-white/90 border border-transparent hover:bg-slate-50',
  },
  sink: {
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-600',
    timeColor: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    activeBg: 'bg-emerald-50/90 border border-emerald-300 font-bold shadow-2xs',
    inactiveBg: 'bg-white/90 border border-transparent hover:bg-slate-50',
  },
};

export const MetricCards: React.FC<MetricCardsProps> = ({ result, threeModesData }) => {
  if (!result) return null;

  const currentParams = result.params;
  const targetT = currentParams.customTargetTemp ?? 30;
  const supplyCost = currentParams.waterCostSupply ?? 300;
  const drainCost = currentParams.waterCostDrain ?? 200;
  const costPerM3 = currentParams.waterCostPerM3 ?? (supplyCost + drainCost);
  const costPerLiter = costPerM3 / 1000.0;
  const activeMode = currentParams.chillerType || 'rotary';

  // サーバーサイド/親から取得した3モード結果を使用
  const modeSimulations = useMemo(() => {
    if (threeModesData) {
      return {
        rotaryRes: threeModesData.rotary,
        coilRes: threeModesData.coil,
        sinkRes: threeModesData.sink,
      };
    }
    return {
      rotaryRes: result,
      coilRes: result,
      sinkRes: result,
    };
  }, [threeModesData, result]);

  // 各温度マイルストーンごとの3モード比較データを作成
  const buildMilestoneData = (
    getTime: (res: SimulationResult) => number | null
  ): ModeResult[] => {
    const { rotaryRes, coilRes, sinkRes } = modeSimulations;
    const tRotary = getTime(rotaryRes);
    const tCoil = getTime(coilRes);
    const tSink = getTime(sinkRes);

    const modesRaw = [
      { modeName: 'QULIYA式' as const, key: 'rotary' as const, res: rotaryRes, time: tRotary },
      { modeName: 'コイル式' as const, key: 'coil' as const, res: coilRes, time: tCoil },
      { modeName: 'シンク式' as const, key: 'sink' as const, res: sinkRes, time: tSink },
    ];

    return modesRaw.map((m) => {
      const hasReached = m.time !== null;
      const roundedTime = hasReached ? Math.round(m.time!) : null;
      const waterL = hasReached ? Math.round(m.res.params.TapFlow * m.time!) : null;
      const costYen = hasReached ? Math.round(waterL! * costPerLiter) : null;
      const ratioStr = m.key === 'sink' ? '1/1' : formatRatioToSink(m.time, tSink);

      return {
        modeName: m.modeName,
        key: m.key,
        time: roundedTime,
        waterL,
        costYen,
        ratioStr,
        isActive: activeMode === m.key,
      };
    });
  };

  const milestones = [
    {
      title: '50℃ 到達',
      tempNum: '50℃',
      icon: <Flame className="w-4 h-4 text-orange-500 shrink-0" />,
      isTarget: false,
      modes: buildMilestoneData((r) => r.timeTo50C),
    },
    {
      title: '40℃ 到達',
      tempNum: '40℃',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      isTarget: false,
      modes: buildMilestoneData((r) => r.timeTo40C),
    },
    {
      title: '30℃ 到達',
      tempNum: '30℃',
      icon: <Clock className="w-4 h-4 text-blue-500 shrink-0" />,
      isTarget: false,
      modes: buildMilestoneData((r) => r.timeTo30C),
    },
    {
      title: `目標 ${targetT}℃ 到達`,
      tempNum: `${targetT}℃`,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
      isTarget: true,
      modes: buildMilestoneData((r) => r.timeToTarget),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {milestones.map((m, idx) => (
        <div
          key={idx}
          className={`rounded-lg p-2.5 border shadow-2xs transition flex flex-col justify-between ${
            m.isTarget
              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/25'
              : 'bg-white border-slate-200/90'
          }`}
        >
          {/* カードヘッダー: 「＊＊℃到達」はバランスの良い text-sm/14px で調和 */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
            <div className="flex items-center space-x-1.5">
              {m.icon}
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight leading-tight ${
                  m.isTarget ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                }`}
              >
                {m.title}
              </span>
            </div>
            {m.isTarget && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-600 text-white rounded-full">
                目標
              </span>
            )}
          </div>

          {/* 各方式のテーブル行 (3方式比較グラフの青・黄・緑と完全連動) */}
          <div className="space-y-1 font-mono text-[10px]">
            {m.modes.map((item) => {
              const style = MODE_STYLES[item.key];
              return (
                <div
                  key={item.modeName}
                  className={`flex items-center justify-between px-1.5 py-0.5 rounded transition ${
                    item.isActive ? style.activeBg : style.inactiveBg
                  }`}
                >
                  {/* 左列: ドット + 方式名 + 時間 + 分 + 比率バッジ */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* 3方式の線色と一致するインジケータードット */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${style.dotColor} ${
                        item.isActive ? 'ring-1 ring-offset-1 ring-slate-400' : 'opacity-85'
                      }`}
                    />

                    <span className={`w-[40px] font-bold shrink-0 ${style.textColor}`}>
                      {item.modeName}
                    </span>

                    <div className="flex items-center justify-end w-[36px] shrink-0">
                      <span
                        className={`text-right text-[11px] font-bold ${
                          item.time !== null ? style.timeColor : 'text-slate-400 font-normal'
                        }`}
                      >
                        {item.time !== null ? item.time : '未達'}
                      </span>
                      {item.time !== null && (
                        <span className="text-[10px] text-slate-500 ml-0.5 font-normal">分</span>
                      )}
                    </div>

                    <div className="w-[30px] flex justify-center shrink-0">
                      {item.time !== null ? (
                        <span
                          className={`text-[9px] w-full text-center px-0.5 py-0.2 rounded font-bold ${style.badge}`}
                          title="所要時間比率"
                        >
                          {item.ratioStr}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300">-</span>
                      )}
                    </div>
                  </div>

                  {/* 右列: 水道: [数字]L / 約[数字]円 */}
                  <div className="flex items-center text-[9.5px] shrink-0 justify-end ml-1">
                    {item.time !== null ? (
                      <div className="flex items-center space-x-0.5">
                        <span className="text-slate-500">水道:</span>
                        <span className="inline-block text-right w-7 font-bold text-blue-700">
                          {item.waterL}
                        </span>
                        <span className="text-slate-500">L / 約</span>
                        <span className="inline-block text-right w-6 font-bold text-slate-800">
                          {item.costYen}
                        </span>
                        <span className="text-slate-500">円</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[9px] italic">時間内未達</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
