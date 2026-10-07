import React from 'react';
import {
  BookOpen,
  RotateCcw,
  Sparkles,
  Sliders,
  Download,
  Server,
} from 'lucide-react';

interface HeaderProps {
  onOpenTheory: () => void;
  onReset: () => void;
  viewMode: 'summary' | 'detail';
  onToggleViewMode: (mode: 'summary' | 'detail') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTheory,
  onReset,
  viewMode,
  onToggleViewMode,
}) => {
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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logos & Title */}
          <div className="flex items-center space-x-3.5">
            {/* パートナー / ブランドロゴ表示エリア */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white/95 px-2.5 py-1 rounded-md shadow-xs border border-white/20">
              {/* [1] 新越ワークス 企業ロゴ */}
              <a
                href="https://www.shin-works.co.jp/"
                target="_blank"
                rel="noopener noreferrer"
                title="株式会社 新越ワークス"
                className="flex items-center hover:opacity-80 transition"
              >
                <img
                  src="https://www.shin-works.co.jp/wp-content/themes/shinetsu_works/dist/images/logo.svg"
                  alt="株式会社 新越ワークス ロゴ"
                  className="h-4 sm:h-4.5 w-auto object-contain max-w-[65px]"
                  onError={(e) => {
                    e.currentTarget.src = '/shin_works_logo.svg';
                  }}
                />
              </a>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* [2] Three Snow ロゴ */}
              <a
                href="https://www.shin-works.co.jp/"
                target="_blank"
                rel="noopener noreferrer"
                title="Three Snow (スリースノー事業部)"
                className="flex items-center hover:opacity-80 transition"
              >
                <img
                  src="https://www.shin-works.co.jp/wp-content/uploads/2024/09/three-snow-logo.svg"
                  alt="Three Snow ロゴ"
                  className="h-4 sm:h-4.5 w-auto object-contain max-w-[65px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* [3] プロジェクト / 製品ブランドロゴ */}
              <div className="flex items-center" title="Project Logo">
                <img
                  src="https://storage.googleapis.com/studio-design-asset-files/projects/nBW2ge8KOv/s-632x190_v-fs_webp_76048f0f-c9e4-44b6-89aa-2e1543bbbfff_small.webp"
                  alt="プロジェクトロゴ"
                  className="h-4 sm:h-4.5 w-auto object-contain max-w-[70px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* [4] 東北大学 多元物質科学研究所 ロゴ */}
              <a
                href="https://www2.tagen.tohoku.ac.jp/"
                target="_blank"
                rel="noopener noreferrer"
                title="東北大学 多元物質科学研究所 (IMRAM)"
                className="flex items-center hover:opacity-80 transition"
              >
                <img
                  src="/tagen_logo.svg"
                  alt="東北大学 多元物質科学研究所 ロゴ"
                  className="h-4.5 sm:h-5 w-auto object-contain max-w-[110px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </a>
            </div>

            {/* アプリケーションタイトル & 東北大学多元物質科学研究所製(英語) */}
            <div className="hidden sm:flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
                  スープチラー急速冷却シミュレーター
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight leading-tight mt-0.5">
                Developed by Institute of Multidisciplinary Research for Advanced Materials (IMRAM), Tohoku University
              </span>
            </div>
          </div>

          {/* Actions & View Mode Toggle */}
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle (詳細 / サマリー) */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center shadow-xs">
              <button
                onClick={() => onToggleViewMode('detail')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'detail'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="詳細な物理パラメータ設定・グラフ解析"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>詳細</span>
              </button>
              <button
                onClick={() => onToggleViewMode('summary')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'summary'
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="月あたりのコスト削減・月額レンタル試算"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>コスト試算</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700 mx-0.5 hidden sm:block" />

            {/* Standalone HTML download */}
            <a
              href="/simulator_standalone.html"
              download="QULIYA_CHILLER_急速冷却シミュレーター.html"
              title="ネット接続不要・誰でもダブルクリックで動く単一HTMLファイルをダウンロード"
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md border border-blue-500 transition cursor-pointer shadow-xs active:scale-95 no-print"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">HTML保存</span>
            </a>

            {/* Synology NAS Package download */}
            <a
              href="/quliya-chiller-nas.zip"
              download="quliya-chiller-nas.zip"
              onClick={handleDownloadZip}
              title="Synology NASにそのまま設置できるサーバー＆Web画面パッケージ一式（特許数式完全保護版）"
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md border border-indigo-500 transition cursor-pointer shadow-xs active:scale-95 no-print"
            >
              <Server className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden lg:inline">NAS用ZIP</span>
            </a>

            {/* Theory modal */}
            <button
              onClick={onOpenTheory}
              title="物理計算モデル・数式解説"
              className="hidden sm:flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2 py-1.5 rounded-md border border-slate-700 transition cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>モデル解説</span>
            </button>

            {/* Reset */}
            <button
              onClick={onReset}
              title="初期パラメータに戻す"
              className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1.5 rounded-md hover:bg-slate-800 border border-slate-700 text-xs transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">初期化</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
