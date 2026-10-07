import React from 'react';
import deviceDiagramImg from '../assets/images/device_diagram.png';

export const ChillerDeviceDiagram: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 sm:p-2.5 flex flex-col justify-between h-full">
      {/* 上部ヘッダー（特願2026-201346 と 特許7598603 を別々のバッジで囲む） */}
      <div className="flex items-center justify-start space-x-1.5 pb-1 border-b border-slate-200 mb-1">
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shadow-2xs">
          特願2026-201346
        </span>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shadow-2xs">
          特許7598603
        </span>
      </div>

      {/* device_diagram.png をそのまま挿入 */}
      <div className="rounded border border-slate-300 bg-white p-1 shadow-xs flex items-center justify-center overflow-hidden">
        <img
          src={deviceDiagramImg}
          alt="QULIYA CHILLER 構造図"
          className="w-full h-auto max-h-[260px] print:max-h-[190px] object-contain rounded-xs"
        />
      </div>

      {/* 伝熱メカニズムの解説 */}
      <div className="mt-1 pt-1 border-t border-slate-200 text-[9.5px] print:text-[8.5px] text-slate-600 leading-tight">
        <strong className="text-slate-800">伝熱メカニズム：</strong>
        金属製円筒の中に水道水を流入させ、スープの中で連続回転。円筒の高速回転により冷却の大きな抵抗となる境膜（温度境界層）を極限まで薄くし、高い熱交換効率で熱々のスープを一気に急速冷却します。
      </div>
    </div>
  );
};
