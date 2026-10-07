import React, { useState } from 'react';
import {
  Sparkles,
  DollarSign,
  ChevronRight,
  Sliders,
  HelpCircle,
  Printer,
  Download,
  Server,
  Building2,
  User,
  Timer,
  Zap,
  CheckCircle2,
  Waves,
  ShieldCheck,
} from 'lucide-react';
import { SimulationResult } from '../types/simulation';

interface SalesSummaryModeProps {
  activeResult: SimulationResult;
  threeModesData: {
    rotary: SimulationResult;
    coil: SimulationResult;
    sink: SimulationResult;
  };
  onSwitchToDetail: () => void;
}

export const SalesSummaryMode: React.FC<SalesSummaryModeProps> = ({
  activeResult,
  threeModesData,
  onSwitchToDetail,
}) => {
  // お客様情報（提案書・印刷時に印字可能）
  const [customerName, setCustomerName] = useState<string>('');
  const [salesRepName, setSalesRepName] = useState<string>('');

  // 営業試算パラメータ (「詳細」で入力されたスープ条件に基づいて月次試算)
  const [dailyBatches, setDailyBatches] = useState<number>(1); // 1日の冷却仕込み回数 (デフォルト1回)
  const [monthlyDays, setMonthlyDays] = useState<number>(26); // 月間稼働日数 (デフォルト26日)
  const [hourlyWage, setHourlyWage] = useState<number>(1200); // パート・スタッフ時給換算 (円)
  const [monthlyRentalYen, setMonthlyRentalYen] = useState<number>(22000); // 回転式チラー月額レンタル料 (デフォルト22,000円/月)
  const [showRoiHelp, setShowRoiHelp] = useState<boolean>(false);

  const targetTemp = activeResult.params.customTargetTemp ?? 30;
  const costPerLiter = (activeResult.params.waterCostPerM3 ?? 500) / 1000.0;

  // 各モードの1回あたり数値 (すべて整数で計算・表示)
  const rotRes = threeModesData.rotary;
  const coilRes = threeModesData.coil;
  const sinkRes = threeModesData.sink;

  // 1回あたりの到達時間（小数2桁なし・整数分）
  const rotTime = Math.round(rotRes.timeToTarget ?? 15);
  const coilTime = Math.round(coilRes.timeToTarget ?? 45);
  const sinkTime = Math.round(sinkRes.timeToTarget ?? 90);

  // 1回あたりの水道使用量 (L, 整数)
  const rotWater = Math.round(rotRes.params.TapFlow * rotTime);
  const coilWater = Math.round(coilRes.params.TapFlow * coilTime);
  const sinkWater = Math.round(sinkRes.params.TapFlow * sinkTime);

  // 1回あたりの水道コスト (円, 整数)
  const rotCostPerBatch = Math.round(rotWater * costPerLiter);
  const coilCostPerBatch = Math.round(coilWater * costPerLiter);
  const sinkCostPerBatch = Math.round(sinkWater * costPerLiter);

  // 1回あたりの削減効果（整数）
  const waterSavingsPerBatch = Math.max(0, sinkCostPerBatch - rotCostPerBatch);
  const timeSavingsMinPerBatch = Math.max(0, sinkTime - rotTime);

  // スピード倍率
  const rotSpeedRatio = (sinkTime / Math.max(1, rotTime)).toFixed(1);
  const coilSpeedRatio = (sinkTime / Math.max(1, coilTime)).toFixed(1);

  // 月間計算
  const monthlyBatches = dailyBatches * monthlyDays;
  const waterSavingsMonth = waterSavingsPerBatch * monthlyBatches;
  const timeSavingsHoursMonth = (timeSavingsMinPerBatch * monthlyBatches) / 60.0;
  const laborSavingsMonth = Math.round(timeSavingsHoursMonth * hourlyWage);

  // 月間総メリット (水道代削減 + 人件費換算)
  const grossSavingsMonth = waterSavingsMonth + laborSavingsMonth;

  // 月間実質手残り (レンタル料控除後)
  const netSavingsMonth = grossSavingsMonth - monthlyRentalYen;

  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 印刷・PDF保存のトリガー
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/quliya-chiller-nas.zip');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quliya-chiller-nas.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.location.href = '/quliya-chiller-nas.zip';
    }
  };

  return (
    <div className="space-y-3">
      {/* 印刷時のみ最上部に表示される「正式提案書ヘッダー」 */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-2 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              QULIYA CHILLER 導入シミュレーション提案書
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              [東北大学IMRAM共同研究モデル]
            </span>
          </div>
          <div className="text-right text-[10px] text-slate-600 font-mono">
            <div>作成日: {todayStr}</div>
            <div>株式会社 新越ワークス / Three Snow</div>
          </div>
        </div>

        {/* 提案先・営業担当名（入力されている場合） */}
        {(customerName || salesRepName) && (
          <div className="mt-1.5 flex items-center justify-between text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500">ご提案先:</span>{' '}
              <strong className="text-sm text-slate-900">
                {customerName ? `${customerName} 御中` : '貴社 御中'}
              </strong>
            </div>
            {salesRepName && (
              <div className="text-[10px] text-slate-700">
                担当営業: <strong>{salesRepName}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. トップコスト試算バナー & PDF・印刷アクション */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3 sm:p-3.5 text-white shadow-md border border-slate-700/80 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>お客様条件での導入メリット（コスト試算）</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              QULIYA CHILLER（月額レンタル）導入によるコスト削減シミュレーション
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              「詳細」タブでお客様のスープ量（{activeResult.params.Soup_mass}kg）、寸胴径（{activeResult.params.Pot_D_mm}mm）、水温（{activeResult.params.TapTemp}℃）等を入力した結果をもとに、月あたりの削減額を試算しています。
            </p>
          </div>

          {/* 右上アクション: PDF保存/印刷 & HTMLファイル保存 & 詳細へ戻る */}
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="/simulator_standalone.html"
              download="QULIYA_CHILLER_急速冷却シミュレーター.html"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-500 transition cursor-pointer shadow-xs active:scale-95 no-print"
              title="ログイン不要・ダブルクリックで動く単一HTMLファイルをダウンロードして関係者にメール送付"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML保存</span>
            </a>

            <a
              href="/quliya-chiller-nas.zip"
              download="quliya-chiller-nas.zip"
              onClick={handleDownloadZip}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-500 transition cursor-pointer shadow-xs active:scale-95 no-print"
              title="Synology NASにそのまま設置できるサーバー＆Web画面パッケージ一式（特許数式完全保護版）"
            >
              <Server className="w-3.5 h-3.5 text-indigo-200" />
              <span>NAS用ZIP保存</span>
            </a>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500 transition cursor-pointer shadow-xs active:scale-95 no-print"
              title="このコスト試算とグラフをA4提案書として印刷またはPDF保存"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF保存 / 印刷</span>
            </button>

            <button
              onClick={onSwitchToDetail}
              className="inline-flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/20 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>「詳細」で条件変更</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 印刷・提案用の顧客名・担当者名入力欄 */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-300">提案先店舗・企業名:</span>
            <input
              type="text"
              placeholder="例: 〇〇ラーメン 渋谷店 様"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-transparent border-b border-cyan-400/50 focus:border-cyan-300 outline-none text-white text-xs font-bold px-1 w-44 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px] text-slate-300">営業担当者:</span>
            <input
              type="text"
              placeholder="例: 山田 太郎"
              value={salesRepName}
              onChange={(e) => setSalesRepName(e.target.value)}
              className="bg-transparent border-b border-cyan-400/50 focus:border-cyan-300 outline-none text-white text-xs font-bold px-1 w-28 placeholder:text-slate-500"
            />
          </div>

          <span className="text-[10px] text-slate-400">
            ※ここにお名前を入力すると、PDF・印刷時の提案書ヘッダーに印字されます
          </span>
        </div>
      </div>

      {/* 2. メインハイライト: 月あたりのコスト削減と回収インパクト */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs page-break-inside-avoid">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-sm text-slate-900">
                月あたりのコスト削減シミュレーション（月額レンタル対比）
              </h3>
            </div>
            <button
              onClick={() => setShowRoiHelp(!showRoiHelp)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 no-print"
              title="計算根拠の確認"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {showRoiHelp && (
            <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1 no-print">
              <p>
                <strong>計算根拠:</strong> 月稼働 {monthlyDays}日 × 1日 {dailyBatches}回 ＝ 計 {monthlyBatches}回の冷却仕込み。
              </p>
              <p>
                ・<strong>水道代削減:</strong> 1回あたり削減 {(sinkWater - rotWater).toLocaleString()}L × 水道料金単価 {activeResult.params.waterCostPerM3 ?? 500}円/m³ (上下水合計)。
              </p>
              <p>
                ・<strong>人件費相当:</strong> 冷却監視・帰宅待ち時間削減 {timeSavingsHoursMonth.toFixed(1)}時間 × 時給換算 {hourlyWage.toLocaleString()}円。
              </p>
            </div>
          )}

          {/* 3つの比較数値カード */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            {/* ① 水道代削減 */}
            <div className="p-3 rounded-lg border border-cyan-200 bg-cyan-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-800">
                  水道料金の削減額
                </span>
                <div className="mt-1 text-xl sm:text-2xl font-black text-cyan-900 font-mono">
                  ▲{waterSavingsMonth.toLocaleString()}
                  <span className="text-xs font-bold ml-0.5 text-cyan-700">円/月</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-cyan-700 border-t border-cyan-200/80 pt-1.5 flex items-center justify-between">
                <span>月間水削減量:</span>
                <span className="font-mono font-bold">
                  {((sinkWater - rotWater) * monthlyBatches).toLocaleString()} L
                </span>
              </div>
            </div>

            {/* ② 時短・人件費相当 */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800">
                  冷却拘束時間の削減
                </span>
                <div className="mt-1 text-xl sm:text-2xl font-black text-amber-900 font-mono">
                  ▲{timeSavingsHoursMonth.toFixed(1)}
                  <span className="text-xs font-bold ml-0.5 text-amber-700">時間/月</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-amber-700 border-t border-amber-200/80 pt-1.5 flex items-center justify-between">
                <span>人件費換算:</span>
                <span className="font-mono font-bold">
                  約{laborSavingsMonth.toLocaleString()} 円相当
                </span>
              </div>
            </div>

            {/* ③ 純手残りメリット（視覚コントラスト極大化） */}
            <div className="p-3.5 rounded-lg border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 flex flex-col justify-between shadow-sm ring-2 ring-emerald-500/25">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                    月間の実質メリット（純手残り）
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded font-sans">
                    実質利益
                  </span>
                </div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight flex items-baseline">
                  {netSavingsMonth >= 0 ? `+${netSavingsMonth.toLocaleString()}` : `${netSavingsMonth.toLocaleString()}`}
                  <span className="text-sm font-bold ml-1 text-emerald-950 font-sans">円/月</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-emerald-900 border-t border-emerald-300/80 pt-1.5 space-y-0.5">
                <div className="flex items-center justify-between font-mono">
                  <span>月レンタル料控除後:</span>
                  <span className="font-bold text-slate-700">▲{monthlyRentalYen.toLocaleString()}円</span>
                </div>
                <div className="text-[10px] text-emerald-800 font-black">
                  {netSavingsMonth >= 0 ? '★毎月の営業利益に直接プラス（完全黒字化）' : '★時短・衛生面で十分回収可能な範囲'}
                </div>
              </div>
            </div>
          </div>

          {/* 年間換算バー */}
          <div className="bg-slate-900 text-white rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 font-medium">
              年間インパクト（×12ヶ月換算）:
            </span>
            <div className="flex items-center space-x-3 font-mono font-bold">
              <span className="text-cyan-300">
                水道代 年間 ▲{(waterSavingsMonth * 12).toLocaleString()}円
              </span>
              <span className="text-amber-300">
                拘束時間 年間 ▲{(timeSavingsHoursMonth * 12).toFixed(0)}時間
              </span>
              <span className="text-emerald-300 underline font-black">
                純メリット 年間 {netSavingsMonth >= 0 ? `+${(netSavingsMonth * 12).toLocaleString()}` : (netSavingsMonth * 12).toLocaleString()}円
              </span>
            </div>
          </div>
        </div>

        {/* 営業試算条件の簡単アジャスト入力 */}
        <div className="mt-3.5 pt-3 border-t border-slate-200 bg-slate-50/70 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
          <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
            <span>お客様の稼働条件・試算前提:</span>
            <span className="text-[10px] text-slate-500 font-normal no-print">
              数値を動かすと即座に上の月額削減額が変わります
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">1日の仕込み回数</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={dailyBatches}
                  onChange={(e) => setDailyBatches(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right"
                />
                <span className="text-slate-500 text-[10px]">回</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">月間営業日数</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={monthlyDays}
                  onChange={(e) => setMonthlyDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right"
                />
                <span className="text-slate-500 text-[10px]">日</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">想定月レンタル料</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="5000"
                  max="100000"
                  step="1000"
                  value={monthlyRentalYen}
                  onChange={(e) => setMonthlyRentalYen(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-emerald-700 text-right"
                />
                <span className="text-slate-500 text-[10px]">円</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">スタッフ時給換算</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="800"
                  max="3000"
                  step="50"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right"
                />
                <span className="text-slate-500 text-[10px]">円</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 1回あたりの冷却スピード＆コスト対比 (すべて整数表示) */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs page-break-inside-avoid">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <h3 className="font-black text-sm text-slate-900">
              1回あたりの冷却スピード＆コスト対比
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            目標温度 {targetTemp}℃ 到達時（1仕込みあたり）
          </span>
        </div>

        {/* 3方式のハイライトカード（上段に一本化） */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* ① QULIYA式 (QULIYA CHILLER) - 推奨・最速・本命の視覚的強調 */}
          <div className="p-3 sm:p-3.5 rounded-lg border-2 border-cyan-500 bg-gradient-to-b from-white via-cyan-50/50 to-cyan-50/90 flex flex-col justify-between shadow-sm ring-2 ring-cyan-500/20">
            <div>
              {/* ヘッダー: バッジとタイトルを安全に横並び（絶対配置をやめて重なりを完全に防止） */}
              <div className="flex items-center justify-between mb-1.5 gap-1 pb-1 border-b border-cyan-100">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0"></span>
                  <span className="text-xs font-black text-cyan-950 truncate">
                    QULIYA式（QULIYA CHILLER）
                  </span>
                </div>
                <span className="bg-cyan-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs shrink-0 whitespace-nowrap">
                  ★推奨・最速・特許技術
                </span>
              </div>

              {/* 到達時間（整数分） */}
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-cyan-950 font-mono">
                  {rotTime}
                </span>
                <span className="text-xs font-bold text-cyan-700">分</span>
                <span className="ml-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  約{rotSpeedRatio}倍速
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-cyan-200/90 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-600">
                <span>水道使用量:</span>
                <span className="font-bold text-slate-900">{rotWater} L</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>1回あたり水道代:</span>
                <span className="font-bold text-cyan-800">{rotCostPerBatch.toLocaleString()} 円</span>
              </div>
              <div className="flex items-center justify-between text-emerald-900 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span>1回あたり削減:</span>
                <span>▲{waterSavingsPerBatch.toLocaleString()} 円 / ▲{timeSavingsMinPerBatch} 分時短</span>
              </div>

              {/* 食中毒リスク・HACCP衛生対策（危険温度帯急速通過） */}
              <div className="mt-1 pt-1.5 border-t border-cyan-200/60 text-[10px] text-cyan-950 font-sans leading-tight">
                <div className="flex items-center space-x-1 font-bold text-red-600 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>衛生・HACCP食中毒リスク防止</span>
                </div>
                <p className="text-[9.5px] text-slate-700 leading-tight">
                  菌が10〜20分で倍増する<strong className="text-red-600 font-bold">最危険増殖ピーク（35℃〜40℃）を一気に突破し30℃へ急冷</strong>。常温放置の爆発的増殖を断ち、冷蔵庫へ即移行可能。
                </p>
              </div>
            </div>
          </div>

          {/* ② 冷却コイル方式 */}
          <div className="p-3 sm:p-3.5 rounded-lg border border-amber-300 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-amber-200/60">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="text-xs font-bold text-slate-800">
                    冷却コイル方式
                  </span>
                </div>
                <span className="text-[9px] text-amber-800 bg-amber-100 px-1 py-0.5 rounded font-sans">
                  据置浸漬
                </span>
              </div>

              {/* 到達時間（整数分） */}
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
                  {coilTime}
                </span>
                <span className="text-xs font-bold text-slate-600">分</span>
                <span className="ml-2 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                  約{coilSpeedRatio}倍速
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-600">
                <span>水道使用量:</span>
                <span className="font-bold text-slate-900">{coilWater} L</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>1回あたり水道代:</span>
                <span className="font-bold text-slate-800">{coilCostPerBatch.toLocaleString()} 円</span>
              </div>
              <div className="flex items-center justify-between text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <span>1回あたり削減:</span>
                <span>▲{Math.max(0, sinkCostPerBatch - coilCostPerBatch).toLocaleString()} 円 / ▲{Math.max(0, sinkTime - coilTime)} 分時短</span>
              </div>

              {/* 衛生・運用上の留意点 */}
              <div className="mt-1 pt-1.5 border-t border-amber-200/60 text-[10px] text-slate-600 font-sans leading-tight">
                <div className="flex items-center space-x-1 font-semibold text-slate-700 mb-0.5">
                  <span>衛生・運用上の留意点</span>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-tight">
                  冷却に40分以上要するため菌増殖帯の滞留が長く、コイル管の洗浄・衛生管理手間も発生。
                </p>
              </div>
            </div>
          </div>

          {/* ③ シンク流水（自然冷却） */}
          <div className="p-3 sm:p-3.5 rounded-lg border border-slate-300 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                  <span className="text-xs font-bold text-slate-800">
                    シンク流水冷却
                  </span>
                </div>
                <span className="text-[9px] text-slate-600 bg-slate-200 px-1 py-0.5 rounded font-sans">
                  自然放置
                </span>
              </div>

              {/* 到達時間（整数分） */}
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-700 font-mono">
                  {sinkTime}
                </span>
                <span className="text-xs font-bold text-slate-600">分</span>
                <span className="ml-2 text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                  基準 (1/1)
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-600">
                <span>水道使用量:</span>
                <span className="font-bold text-slate-900">{sinkWater} L</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>1回あたり水道代:</span>
                <span className="font-bold text-slate-800">{sinkCostPerBatch.toLocaleString()} 円</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                <span>1回あたり削減:</span>
                <span>- (従来の基準方式)</span>
              </div>

              {/* 衛生・運用上の留意点 */}
              <div className="mt-1 pt-1.5 border-t border-slate-200 text-[10px] text-slate-600 font-sans leading-tight">
                <div className="flex items-center space-x-1 font-semibold text-slate-700 mb-0.5">
                  <span>衛生・運用上の留意点</span>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-tight">
                  約1.5時間流水放置するため菌増殖リスクが最も高く、大量の水道水を浪費。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* なぜ目標30℃冷却が決定的に重要なのか？のワンポイント解説バナー */}
        <div className="mt-2.5 bg-gradient-to-r from-red-50 via-amber-50/40 to-slate-50 border border-red-200/80 rounded-lg p-2 sm:p-2.5 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
          <div className="bg-red-100 text-red-700 p-1 rounded-md shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 leading-snug">
            <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900 text-[11px]">
              <span className="text-red-700">💡 なぜ「30℃」への急速冷却で劇的な効果があるのか？</span>
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-normal">
                食中毒菌の至適発育温度：35℃〜40℃
              </span>
            </div>
            <p className="text-[10px] text-slate-600 leading-normal">
              食中毒菌（中温菌）は<strong className="text-red-600 font-bold">「35℃〜40℃（体温前後）」で10〜20分ごとに菌数が倍増</strong>する最も危険な発育ピークを迎えます。加熱後の鍋をコンロやシンクで放置するとこの危険帯に1時間以上滞留してしまいますが、QULIYA式チラーで<strong className="text-red-600 font-bold">まず30℃以下まで一気に粗熱を取る</strong>ことで爆発的増殖を断ち切り、冷蔵庫の庫内温度を上げずに速やかに保冷保管へ移せます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
