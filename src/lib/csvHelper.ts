import { SimulationParams, SimulationResult, TimeStepData } from '../types/simulation';

/**
 * CSV ヘルパー関数群
 * PowerShell v7.3 の conditions.csv / SIM_results.csv / simresult.csv と互換
 */

export function exportDetailCsv(result: SimulationResult): void {
  const headers = [
    'Time_min',
    'Soup_Temp_C',
    'Tap_In_C',
    'Tap_Out_C',
    'U_W_m2K',
    'Re_Total',
    'Q_cool_W',
    'Q_evap_W',
    'Q_conv_W',
    'Latent_Ratio_pct',
  ];

  const rows = result.timeSeries.map((d: TimeStepData) => [
    d.timeMin.toFixed(2),
    d.soupTemp.toFixed(2),
    d.tapIn.toFixed(1),
    d.tapOut.toFixed(2),
    d.uVal.toFixed(1),
    d.reTotal.toFixed(1),
    d.qCool.toFixed(0),
    d.qEvap.toFixed(0),
    d.qConv.toFixed(0),
    d.latentRatio.toFixed(1),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadBlob(csvContent, `simresult_${result.caseName}.csv`, 'text/csv;charset=utf-8;');
}

export function exportSummaryCsv(results: SimulationResult[]): void {
  const headers = [
    'CaseName',
    'RPM',
    'TapFlow',
    'TapTemp',
    'Soup_mass',
    'StartTemp',
    'Brix',
    'Ex_D_mm',
    'Ex_L_mm',
    'Pot_D_mm',
    'RoomTemp',
    'RoomRH',
    'Time_to_40C',
    'Time_to_30C',
    'Time_to_20C',
    'Final_Temp_C',
    'Total_Time_min',
    'Avg_U_W_m2K',
    'Max_Q_cool_W',
    'Total_Water_L',
    'Heat_Extracted_kcal',
  ];

  const rows = results.map((r) => [
    `"${r.caseName}"`,
    r.params.RPM,
    r.params.TapFlow,
    r.params.TapTemp,
    r.params.Soup_mass,
    r.params.StartTemp,
    r.params.Brix,
    r.params.Ex_D_mm,
    r.params.Ex_L_mm,
    r.params.Pot_D_mm,
    r.params.RoomTemp,
    r.params.RoomRH,
    r.timeTo40C !== null ? r.timeTo40C.toFixed(2) : '-',
    r.timeTo30C !== null ? r.timeTo30C.toFixed(2) : '-',
    r.timeTo20C !== null ? r.timeTo20C.toFixed(2) : '-',
    r.finalTemp.toFixed(2),
    r.totalTimeMin.toFixed(2),
    r.avgU.toFixed(1),
    r.maxU,
    (r.params.TapFlow * r.totalTimeMin).toFixed(1),
    (r.totalQCoolMJ * 238.846).toFixed(1),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadBlob(csvContent, 'SIM_results.csv', 'text/csv;charset=utf-8;');
}

export function exportSampleConditionsCsv(): void {
  const sample = `CaseName,RPM,TapFlow,TapTemp,Soup_mass,StartTemp,Brix,Ex_D_mm,Ex_L_mm,Pot_D_mm,RoomTemp,RoomRH
Case01_Standard,50,10,15,20,85,5,12.7,5000,390,22,50
Case02_HighRPM,75,10,15,20,85,5,12.7,5000,390,22,50
Case03_LowRPM,30,10,15,20,85,5,12.7,5000,390,22,50
Case04_HighFlow,50,15,15,20,85,5,12.7,5000,390,22,50
Case05_ThickBrix10,50,10,15,20,85,10,12.7,5000,390,22,50
Case06_ColdWater10C,50,10,10,20,85,5,12.7,5000,390,22,50`;

  downloadBlob(sample, 'conditions_template.csv', 'text/csv;charset=utf-8;');
}

export function parseConditionsCsv(csvText: string): Partial<SimulationParams>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const parsedRows: Partial<SimulationParams>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cells.length < 2) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cells[idx] || '';
    });

    const parsed: Partial<SimulationParams> = {
      caseName: rowObj['CaseName'] || `Imported_Case_${i}`,
      RPM: Number(rowObj['RPM']) || 50,
      TapFlow: Number(rowObj['TapFlow']) || 10,
      TapTemp: Number(rowObj['TapTemp']) || 15,
      Soup_mass: Number(rowObj['Soup_mass']) || 20,
      StartTemp: Number(rowObj['StartTemp']) || 85,
      Brix: Number(rowObj['Brix']) || 5,
      Ex_D_mm: Number(rowObj['Ex_D_mm']) || 12.7,
      Ex_L_mm: Number(rowObj['Ex_L_mm']) || 5000,
      Pot_D_mm: Number(rowObj['Pot_D_mm']) || 390,
      RoomTemp: Number(rowObj['RoomTemp']) || 22,
      RoomRH: Number(rowObj['RoomRH']) || 50,
    };

    parsedRows.push(parsed);
  }

  return parsedRows;
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  // UTF-8 BOM for Excel compatibility in Japanese environments
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
