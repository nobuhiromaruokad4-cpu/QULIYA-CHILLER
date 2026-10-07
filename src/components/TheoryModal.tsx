import React from 'react';
import { X, ShieldCheck, Atom, Activity, Sparkles } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              シミュレーター概要 & 物理モデル仕様 (Secure Cloud Engine)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-700">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b pb-1">
              <Atom className="w-4 h-4 text-cyan-600" />
              <span>1. 伝熱物理モデル・数値積分の概要</span>
            </h4>
            <p>
              本シミュレーターは、寸胴鍋内の撹拌流とQULIYA CHILLER（回転式熱交換器）における強制対流熱伝達、液表面からの水蒸気蒸発潜熱、および容器外壁からの自然放熱の相互作用を考慮した非定常熱収支モデルを採用しています。
            </p>
            <p className="text-slate-600">
              時間進行には4次ルンゲ＝クッタ法（Runge-Kutta 4th Order）を用い、非線形な流体物性や熱通過率の変動を高精度に数値解析しています。
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b pb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>2. 3方式の比較仕様</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                <strong>QULIYA式（QULIYA CHILLER）：</strong>管内流速と外周旋回流の合成伝熱特性、およびε-NTU法による動的熱交換。
              </li>
              <li>
                <strong>コイル式チラー：</strong>SUS製冷却コイル管浸漬による標準熱通過モデル。
              </li>
              <li>
                <strong>シンク式冷却：</strong>流水シンクへの寸胴鍋浸漬による外部冷却モデル。
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-600 leading-normal">
              <span className="font-bold text-slate-800 block mb-0.5">高精度クラウド計算エンジン</span>
              独自の熱伝達相関式、無次元数パラメータ、および最適化物理係数はサーバーサイドの専用エンジン内で安全に保護・実行されています。
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
