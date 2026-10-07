import React, { useState } from 'react';
import {
  Table,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { SimulationResult, TimeStepData } from '../types/simulation';

interface DataTableSectionProps {
  result: SimulationResult | null;
}

export const DataTableSection: React.FC<DataTableSectionProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [minFilter, setMinFilter] = useState('');

  if (!result) return null;

  // フィルタ（指定分数以降）を適用、未指定なら全件表示
  const filteredData = result.timeSeries.filter((d) => {
    if (!minFilter) return true;
    return d.timeMin >= parseFloat(minFilter);
  });

  const handleCopyClipboard = () => {
    const header = 'Time_min\tSoup_Temp_C\tTap_In_C\tTap_Out_C\tU_W_m2K\tRe_Total\tQ_cool_W\tQ_evap_W\tQ_conv_W';
    const lines = filteredData.map((d) =>
      `${d.timeMin.toFixed(2)}\t${d.soupTemp.toFixed(2)}\t${d.tapIn.toFixed(1)}\t${d.tapOut.toFixed(2)}\t${d.uVal.toFixed(1)}\t${d.reTotal.toFixed(1)}\t${d.qCool.toFixed(0)}\t${d.qEvap.toFixed(0)}\t${d.qConv.toFixed(0)}`
    );
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-slate-800">
      {/* Table header bar */}
      <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Table className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <h3 className="font-bold text-slate-800 text-xs tracking-wide">
            時系列シミュレーション詳細データ (simresult.csv)
          </h3>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-200/70 px-1.5 py-0.2 rounded">
            全件表示: {filteredData.length} ステップ (1分毎)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter */}
          <div className="flex items-center space-x-1 text-[11px]">
            <Filter className="w-3 h-3 text-slate-400" />
            <input
              type="number"
              placeholder="何分以降"
              value={minFilter}
              onChange={(e) => setMinFilter(e.target.value)}
              className="w-16 px-1.5 py-0.5 text-[10px] border border-slate-300 rounded bg-white font-mono"
            />
          </div>

          {/* Copy */}
          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
            title="TSV形式でクリップボードへコピー"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-medium">コピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>全件数値をコピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table content (全件スクロール表示) */}
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
        <table className="w-full text-left text-[11px] font-mono whitespace-nowrap">
          <thead className="bg-slate-100/90 text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
            <tr>
              <th className="px-3 py-1 font-bold">経過時間 (分)</th>
              <th className="px-3 py-1 font-bold text-rose-700">スープ温度 (℃)</th>
              <th className="px-3 py-1 font-bold text-cyan-700">水道水 入口 (℃)</th>
              <th className="px-3 py-1 font-bold text-orange-700">水道水 出口 (℃)</th>
              <th className="px-3 py-1 font-bold text-teal-700">総括U (W/m²K)</th>
              <th className="px-3 py-1 font-bold text-indigo-700">合成Re</th>
              <th className="px-3 py-1 font-bold text-blue-700">水道水抜熱 Q (W)</th>
              <th className="px-3 py-1 font-bold text-amber-700">蒸発熱 (W)</th>
              <th className="px-3 py-1 font-bold text-emerald-700">自然放熱 (W)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((row: TimeStepData, idx: number) => {
              const isHighlight =
                (row.soupTemp <= 40.2 && row.soupTemp >= 39.8) ||
                (row.soupTemp <= 30.2 && row.soupTemp >= 29.8) ||
                (row.soupTemp <= 20.2 && row.soupTemp >= 19.8);

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition ${
                    isHighlight ? 'bg-amber-50/70 font-bold' : ''
                  }`}
                >
                  <td className="px-3 py-1 text-slate-700">{row.timeMin.toFixed(2)}</td>
                  <td className="px-3 py-1 text-rose-600 font-bold">{row.soupTemp.toFixed(2)}</td>
                  <td className="px-3 py-1 text-cyan-600">{row.tapIn.toFixed(1)}</td>
                  <td className="px-3 py-1 text-orange-600">{row.tapOut.toFixed(2)}</td>
                  <td className="px-3 py-1 text-teal-700">{row.uVal.toFixed(1)}</td>
                  <td className="px-3 py-1 text-indigo-700">{row.reTotal.toFixed(0)}</td>
                  <td className="px-3 py-1 text-blue-700">{row.qCool.toLocaleString()}</td>
                  <td className="px-3 py-1 text-amber-600">{row.qEvap.toLocaleString()}</td>
                  <td className="px-3 py-1 text-emerald-600">{row.qConv.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
