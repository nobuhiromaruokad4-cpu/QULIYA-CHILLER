/**
 * =========================================================================
 * 撹拌式急速冷却シミュレーター (QULIYA CHILLER) - サーバーサイド計算エンジン
 * 【特許・伝熱工学ロジック完全秘匿版】 (Google Apps Script: Code.gs)
 * =========================================================================
 * 
 * このファイルはGoogleのサーバー上でのみ実行されます。
 * ブラウザの閲覧者・外部ユーザーには数式や経験定数は一切見えません。
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('撹拌式急速冷却シミュレーター (QULIYA CHILLER)')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 経験定数テーブル (サーバー側で完全秘匿)
var _K = {
  w_a: 2.414e-5,
  w_b: 247.8,
  w_c: 140,
  s_c: 4186.0,
  s_k: 4184.0,
  c_ev: 0.135,
  c_ev_r: 1.57e-10,
  c_cv: 15.0,
  c_re: 3.8508,
  c_ex: 0.6301,
  c_al: 0.2588,
  u_snk: 100.0,
  u_col: 200.0
};

function _calcMu(Tc, b) {
  var Tk = Tc + 273.15;
  return _K.w_a * Math.pow(10, _K.w_b / (Tk - _K.w_c)) * Math.pow(10, 0.05 * b);
}

function _calcRho(Tc, b) {
  return 1000.0 - (Math.pow(Tc - 4.0, 2) / 180.0) + 5.0 * b;
}

function _calcCp(b) {
  return (4.186 - 0.03 * b) * 1000.0;
}

function _computeState(Tc, p) {
  var mode = p.chillerType || 'rotary';
  var pr = p.Pot_D_mm / 2000.0;
  var pd = p.Pot_D_mm / 1000.0;
  var ph = (p.Pot_H_mm || 390.0) / 1000.0;
  var la = Math.PI * Math.pow(pr, 2);
  var cp = _calcCp(p.Brix);

  var rho = _calcRho(Tc, p.Brix);
  var mu = _calcMu(Tc, p.Brix);
  var vol = p.Soup_mass / rho;
  var hliq = vol / la;
  var sarea = pd * Math.PI * hliq;

  var exA = 0.0;
  var exd = p.Ex_D_mm;
  if (mode === 'sink') {
    exA = Math.PI * Math.pow(pr, 2) + pd * Math.PI * (ph / 2.0);
  } else if (mode === 'coil') {
    exd = 9.52;
    exA = (exd / 1000.0) * Math.PI * 10.0;
  } else {
    exd = p.Ex_D_mm;
    exA = (exd / 1000.0) * Math.PI * (p.Ex_L_mm / 1000.0);
  }

  var psp = 0.611 * Math.exp((17.27 * Tc) / (Tc + 237.3));
  var psr = 0.611 * Math.exp((17.27 * p.RoomTemp) / (p.RoomTemp + 237.3));

  var qev = (_K.c_ev + _K.c_ev_r * Math.pow(p.RPM, 3.0)) * la * (psp - (p.RoomRH / 100.0) * psr) * 1000.0;
  if (qev < 0) qev = 0;

  var expSide = mode === 'sink' ? Math.max(0, pd * Math.PI * Math.max(0, hliq - ph / 2.0)) : sarea;
  var qcv = _K.c_cv * expSide * (Tc - p.RoomTemp);
  var qloss = qev + qcv;

  var qcool = 0.0;
  var uval = 0.0;
  var retot = 0.0;
  var rerot = 0.0;
  var retube = 0.0;
  var tout = p.TapTemp;

  if (p.TapFlow > 0) {
    if (mode === 'sink') {
      uval = p.fixedU || _K.u_snk;
    } else if (mode === 'coil') {
      uval = p.fixedU || _K.u_col;
    } else {
      var nrps = Math.max(p.RPM, 10.0) / 60.0;
      var dchar = exd / 1000.0;
      rerot = (rho * nrps * Math.pow(dchar, 2)) / mu;

      var rhotap = _calcRho(p.TapTemp, 0.0);
      var mutap = _calcMu(p.TapTemp, 0.0);
      var flow = Math.max(p.TapFlow, 0.1) / 60000.0;
      var tdm = exd / 1000.0;
      var atube = (Math.PI * Math.pow(tdm, 2)) / 4.0;
      var vel = flow / atube;
      retube = (rhotap * vel * tdm) / mutap;

      retot = Math.sqrt(Math.pow(_K.c_al * rerot, 2) + Math.pow(retube, 2));
      uval = _K.c_re * Math.pow(retot, _K.c_ex);
    }

    var mdot = p.TapFlow / 60.0;
    var cap = mdot * _K.s_c;

    var ntu = (uval * exA) / cap;
    var eff = 1.0 - Math.exp(-ntu);
    qcool = eff * cap * (Tc - p.TapTemp);
    tout = p.TapTemp + qcool / cap;
  }

  var latr = 0.0;
  if (qloss > 0) latr = (qev / qloss) * 100.0;

  var dtdt = -(qcool + qloss) / (p.Soup_mass * cp);

  return {
    dTdt: dtdt,
    U: uval,
    Q_cool: qcool,
    Re_Total: retot,
    Re_Rot: rerot,
    Re_Tube: retube,
    Q_loss: qloss,
    Q_evap: qev,
    Q_conv: qcv,
    Latent_Ratio: latr,
    Tap_Out: tout
  };
}

function _runSimulationInternal(params, caseId) {
  var dt = params.dt > 0 ? params.dt : 2.0;
  var maxDisplaySec = (params.maxTimeMin || 120) * 60;
  var maxCompSec = Math.max(maxDisplaySec, 24 * 3600);
  var targetC = params.customTargetTemp !== undefined ? params.customTargetTemp : 30.0;

  var tcurr = params.StartTemp;
  var time = 0.0;
  var r50 = null;
  var r40 = null;
  var r30 = null;
  var r20 = null;
  var rtar = null;
  var lastout = -60.0;

  var series = [];
  var usum = 0;
  var qsum = 0;
  var maxq = 0;
  var steps = 0;

  var init = _computeState(tcurr, params);
  series.push({
    timeMin: 0,
    timeSec: 0,
    soupTemp: Number(tcurr.toFixed(2)),
    tapIn: Number(params.TapTemp.toFixed(1)),
    tapOut: Number(init.Tap_Out.toFixed(2)),
    uVal: Number(init.U.toFixed(1)),
    qCool: Number(init.Q_cool.toFixed(0)),
    dTdt: Number(init.dTdt.toFixed(4))
  });

  lastout = 0;
  usum += init.U;
  qsum += init.Q_cool;
  maxq = Math.max(maxq, init.Q_cool);
  steps++;

  while (time <= maxCompSec) {
    if (tcurr <= params.TapTemp + 0.05) break;
    if (time > maxDisplaySec && rtar !== null && (targetC > 20 || r20 !== null)) break;

    var prevT = tcurr;
    var prevTime = time;

    var k1 = _computeState(tcurr, params).dTdt;
    var k2 = _computeState(tcurr + 0.5 * dt * k1, params).dTdt;
    var k3 = _computeState(tcurr + 0.5 * dt * k2, params).dTdt;
    var k4 = _computeState(tcurr + dt * k3, params).dTdt;

    tcurr += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4);
    time += dt;

    if (r50 === null && prevT >= 50.0 && tcurr <= 50.0) {
      r50 = (prevTime + ((prevT - 50.0) / (prevT - tcurr)) * dt) / 60.0;
    }
    if (r40 === null && prevT >= 40.0 && tcurr <= 40.0) {
      r40 = (prevTime + ((prevT - 40.0) / (prevT - tcurr)) * dt) / 60.0;
    }
    if (r30 === null && prevT >= 30.0 && tcurr <= 30.0) {
      r30 = (prevTime + ((prevT - 30.0) / (prevT - tcurr)) * dt) / 60.0;
    }
    if (r20 === null && prevT >= 20.0 && tcurr <= 20.0) {
      r20 = (prevTime + ((prevT - 20.0) / (prevT - tcurr)) * dt) / 60.0;
    }
    if (rtar === null && prevT >= targetC && tcurr <= targetC) {
      rtar = (prevTime + ((prevT - targetC) / (prevT - tcurr)) * dt) / 60.0;
    }

    if (time <= maxDisplaySec + 0.001 && time >= lastout + 60.0 - 0.001) {
      var st = _computeState(tcurr, params);
      series.push({
        timeMin: Number((time / 60.0).toFixed(2)),
        timeSec: Math.round(time),
        soupTemp: Number(tcurr.toFixed(2)),
        tapIn: Number(params.TapTemp.toFixed(1)),
        tapOut: Number(st.Tap_Out.toFixed(2)),
        uVal: Number(st.U.toFixed(1)),
        qCool: Number(st.Q_cool.toFixed(0)),
        dTdt: Number(st.dTdt.toFixed(4))
      });

      lastout = time;
      usum += st.U;
      qsum += st.Q_cool;
      maxq = Math.max(maxq, st.Q_cool);
      steps++;
    }
  }

  var finalMin = time / 60.0;
  var avgU = steps > 0 ? usum / steps : 0;
  var avgQ = steps > 0 ? qsum / steps : 0;
  var deltaT = params.StartTemp - tcurr;
  var heatJ = params.Soup_mass * _calcCp(params.Brix) * Math.max(0, deltaT);

  return {
    id: caseId,
    params: params,
    timeTo50C: r50 !== null ? Math.round(r50) : null,
    timeTo40C: r40 !== null ? Math.round(r40) : null,
    timeTo30C: r30 !== null ? Math.round(r30) : null,
    timeTo20C: r20 !== null ? Math.round(r20) : null,
    timeToTarget: rtar !== null ? Math.round(rtar) : null,
    targetTemp: targetC,
    finalTemp: Number(tcurr.toFixed(2)),
    totalTimeMin: Number(finalMin.toFixed(2)),
    avgU: Number(avgU.toFixed(1)),
    maxU: Math.round(maxq),
    totalQCoolMJ: Number((heatJ / 1e6).toFixed(2)),
    timeSeries: series
  };
}

/**
 * 外部（HTMLフロントエンド）から呼び出されるAPI
 * ブラウザ側からはこの関数名と引数しか見えません。
 */
function apiSimulate3Modes(paramsJson) {
  try {
    var params = typeof paramsJson === 'string' ? JSON.parse(paramsJson) : paramsJson;
    
    var rotaryParams = Object.assign({}, params, { chillerType: 'rotary' });
    var coilParams = Object.assign({}, params, { chillerType: 'coil' });
    var sinkParams = Object.assign({}, params, { chillerType: 'sink' });

    var rotary = _runSimulationInternal(rotaryParams, 'rotary');
    var coil = _runSimulationInternal(coilParams, 'coil');
    var sink = _runSimulationInternal(sinkParams, 'sink');

    return {
      success: true,
      data: {
        rotary: rotary,
        coil: coil,
        sink: sink
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}
