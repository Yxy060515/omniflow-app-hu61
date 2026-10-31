import {
  BUS_CAPACITY,
  COLLEGE_STOPS,
  LEVEL_LABEL,
  ROUTE_META,
  ROUTE_STOPS,
  levelFromRatio,
} from '../../shared/campus';
import type {
  AdviceInfo,
  ArrivalInfo,
  BusInfo,
  CollegeHeat,
  CrowdLevel,
  RouteId,
  RouteOverview,
  StopInfo,
  Trend,
  TransitOverview,
  TripPlan,
} from '../../shared/types/transit';
import { feedbackRepository } from '../repositories/feedbackRepository';

const MIN_PER_STOP = 2;
const BUSES_PER_ROUTE = 4;
const ROUTE_IDS: RouteId[] = ['1', '2'];
const OFFLINE_STOPS = new Set(['竹苑']);
const TEACHING_STOPS = new Set(['敏行楼', '敏达楼', '竞慧楼', '竞秀楼']);
const STOP_BASE_QUEUE: Record<string, number> = {
  沁园: 20,
  润园: 30,
  泽园南: 24,
  澄园南: 18,
  竹苑: 14,
  泽园餐厅: 12,
  润园餐厅: 12,
  澄园北: 12,
  敏行楼: 10,
  敏达楼: 8,
  竞慧楼: 10,
  竞秀楼: 8,
  中和楼: 12,
  南门北: 6,
  南门西: 6,
  南门南: 5,
};
const FEEDBACK_TARGET: Record<CrowdLevel, number> = {
  idle: 0.25,
  normal: 0.55,
  crowded: 0.8,
  full: 0.95,
};

interface FeedbackSample {
  routeId: string;
  level: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function smoothNoise(seed: string, t: number): number {
  const h = hash01(seed) * 100;
  return 0.5 + 0.5 * Math.sin(t / 6 + h) * Math.cos(t / 17 + h * 1.7);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function localParts(ms: number) {
  const d = new Date(ms + 8 * 3600000);
  return {
    hour: d.getUTCHours() + d.getUTCMinutes() / 60,
    label: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

function demandProfile(h: number, peak: boolean): number {
  if (peak) return 1;
  if (h >= 7 && h < 8.75) return 0.95;
  if (h >= 6.5 && h < 7) return 0.6;
  if (h >= 8.75 && h < 9.5) return 0.55;
  if (h >= 11.5 && h < 13) return 0.6;
  if (h >= 17 && h < 18.5) return 0.65;
  return 0.3;
}

function buildBuses(routeId: RouteId, t: number, demand: number, fb: number | null): BusInfo[] {
  const stops = ROUTE_STOPS[routeId];
  const n = stops.length;
  return Array.from({ length: BUSES_PER_ROUTE }, (_, k) => {
    const id = `${routeId}路-0${k + 1}`;
    const raw = t / MIN_PER_STOP + (k * n) / BUSES_PER_ROUTE + (routeId === '2' ? 1.5 : 0);
    const position = ((raw % n) + n) % n;
    let ratio = clamp(demand * (0.55 + 0.5 * smoothNoise(id, t)), 0.08, 1);
    if (fb !== null) ratio = clamp(ratio * 0.75 + fb * 0.25, 0.05, 1);
    const load = Math.round(ratio * BUS_CAPACITY);
    const finalRatio = load / BUS_CAPACITY;
    const nextStopIndex = Math.ceil(position) % n;
    return {
      id,
      routeId,
      position: Math.round(position * 100) / 100,
      load,
      capacity: BUS_CAPACITY,
      ratio: Math.round(finalRatio * 100) / 100,
      level: levelFromRatio(finalRatio),
      confidence: Math.round((0.82 + 0.08 * hash01(id) + (fb !== null ? 0.05 : 0)) * 100) / 100,
      nextStopIndex,
      nextStopName: stops[nextStopIndex],
    };
  });
}

function queueAt(name: string, seedKey: string, t: number, demand: number, offline: boolean): number {
  const base = STOP_BASE_QUEUE[name] ?? 6;
  if (offline) return Math.round(base * demand);
  return Math.round(base * demand * (0.6 + 0.8 * smoothNoise(seedKey, t)));
}

function trendOf(name: string, seedKey: string, t: number, demand: number, offline: boolean): Trend {
  if (offline) return 'flat';
  const diff = queueAt(name, seedKey, t, demand, false) - queueAt(name, seedKey, t - 10, demand, false);
  if (diff >= 2) return 'up';
  if (diff <= -2) return 'down';
  return 'flat';
}

function buildStops(routeId: RouteId, t: number, demand: number): StopInfo[] {
  return ROUTE_STOPS[routeId].map((name, index) => {
    const segment = name === '中和楼' ? (index === 1 ? 'outbound' : 'return') : null;
    const seedKey = `${name}${segment ?? ''}`;
    const offline = OFFLINE_STOPS.has(name);
    return {
      index,
      name,
      segment,
      queue: queueAt(name, seedKey, t, demand, offline),
      trend: trendOf(name, seedKey, t, demand, offline),
      offline,
    };
  });
}

function buildArrivals(routeId: RouteId, buses: BusInfo[], stopName: string, queue: number): ArrivalInfo[] {
  const stops = ROUTE_STOPS[routeId];
  const n = stops.length;
  const idxs = stops.map((s, i) => (s === stopName ? i : -1)).filter((i) => i >= 0);
  return buses
    .map((b) => {
      const d = Math.min(...idxs.map((i) => (((i - b.position) % n) + n) % n));
      const alight = Math.round(b.load * (TEACHING_STOPS.has(stopName) ? 0.35 : 0.12));
      const remainingSeats = clamp(b.capacity - b.load + alight, 0, b.capacity);
      const arrival: ArrivalInfo = {
        busId: b.id,
        routeId,
        etaMin: Math.max(1, Math.ceil(d * MIN_PER_STOP)),
        stopsAway: Math.floor(d),
        load: b.load,
        level: b.level,
        remainingSeats,
        verdict: remainingSeats >= queue ? 'likely' : 'unlikely',
      };
      return { d, arrival };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map((x) => x.arrival);
}

function buildAdvice(
  closed: boolean,
  stopName: string,
  queue: number,
  trend: Trend,
  offline: boolean,
  arrivals: ArrivalInfo[],
  feedbackCount: number,
): AdviceInfo {
  const trendText = trend === 'up' ? '上升' : trend === 'down' ? '下降' : '持平';
  if (closed) {
    return {
      action: 'closed',
      title: '当前非运营时段',
      summary: '校园公交运营时间为 06:30–23:00，现在暂无班次。可打开「早八高峰演示」预览高峰时段的建议。',
      confidence: 0.95,
      lowConfidence: false,
      simplified: true,
      basis: [{ label: '运营时间', value: '06:30–23:00' }],
    };
  }
  const all = [...arrivals].sort((a, b) => a.etaMin - b.etaMin);
  const likely = all.filter((a) => a.verdict === 'likely' && a.level !== 'full');
  let action: AdviceInfo['action'];
  let title: string;
  let summary: string;
  let confidence = 0.9;
  if (likely.length > 0) {
    const best = likely[0];
    action = best.etaMin <= 8 ? 'go_now' : 'wait';
    title = action === 'go_now' ? '建议现在出发' : '可以晚点再出发';
    summary = `当前「${stopName}」站 ${best.routeId} 路公交预计 ${best.etaMin} 分钟后到达，车内${LEVEL_LABEL[best.level]}（预计剩余 ${best.remainingSeats} 位），本站候车 ${queue} 人，大概率能上车。`;
    if (action === 'wait') summary += ' 下一班较晚，不必着急出门。';
    if (best.etaMin > 10) confidence -= 0.1;
  } else {
    const nonFull = all
      .filter((a) => a.level !== 'full')
      .sort((a, b) => b.remainingSeats - a.remainingSeats);
    if (nonFull.length > 0) {
      const best = nonFull[0];
      action = 'switch_route';
      title = `建议换乘 ${best.routeId} 路`;
      summary = `本站候车 ${queue} 人，近两班车的剩余空位不足以全部上车；${best.routeId} 路 ${best.etaMin} 分钟后到达，预计剩余 ${best.remainingSeats} 位，相对更宽松。`;
      confidence -= 0.12;
    } else {
      action = 'walk';
      title = '建议步行或骑行';
      summary = `两条线路近两班车均已满员，本站候车 ${queue} 人。建议步行/骑行前往，或错峰 10 分钟再出门。`;
      confidence -= 0.05;
    }
  }
  if (offline) confidence -= 0.2;
  if (feedbackCount === 0) confidence -= 0.05;
  confidence = Math.round(clamp(confidence, 0.3, 0.98) * 100) / 100;
  const basis = [
    { label: '本站候车', value: `${queue} 人（${trendText}）` },
    ...all.map((a) => ({
      label: `${a.routeId} 路 · ${a.busId}`,
      value: `${a.etaMin} 分钟到站 · 车内 ${a.load}/${BUS_CAPACITY}（${LEVEL_LABEL[a.level]}）· 剩余 ${a.remainingSeats} 位`,
    })),
    {
      label: '数据来源',
      value: `${offline ? '站点设备离线，历史估算' : '传感器在线'} · 近 10 分钟众包反馈 ${feedbackCount} 条`,
    },
  ];
  return { action, title, summary, confidence, lowConfidence: confidence < 0.6, simplified: true, basis };
}

function buildPlans(closed: boolean, now: number, byRoute: Record<RouteId, ArrivalInfo[]>): TripPlan[] {
  if (closed) return [];
  const all = ROUTE_IDS.flatMap((r) => byRoute[r]);
  const ranked = [...all].sort((a, b) => {
    const sa = (a.verdict === 'likely' ? 0 : 100) + a.etaMin;
    const sb = (b.verdict === 'likely' ? 0 : 100) + b.etaMin;
    return sa - sb;
  });
  const first = ranked[0];
  if (!first) return [];
  const at = (min: number) => localParts(now + min * 60000).label;
  const plans: TripPlan[] = [
    {
      id: 'plan-ride',
      title: `乘坐 ${first.routeId} 路公交 (${at(first.etaMin)} 班次)`,
      routeId: first.routeId,
      boardTime: at(first.etaMin),
      etaMin: first.etaMin,
      walkMin: 0,
      level: first.level,
      seats: first.remainingSeats,
      note: `车内${LEVEL_LABEL[first.level]}，预计剩余 ${first.remainingSeats} 位，约 ${first.etaMin} 分钟后到站。`,
    },
  ];
  const other: RouteId = first.routeId === '1' ? '2' : '1';
  const candidates = byRoute[other];
  const alt = candidates.find((a) => a.etaMin >= 5) ?? candidates[candidates.length - 1];
  if (alt) {
    const wait = Math.max(alt.etaMin, 5);
    plans.push({
      id: 'plan-walk',
      title: `步行 + ${other} 路公交`,
      routeId: other,
      boardTime: at(wait),
      etaMin: wait,
      walkMin: 5,
      level: alt.level,
      seats: alt.remainingSeats,
      note: `先步行约 5 分钟到相邻站点，${at(wait)} 乘 ${other} 路，预计剩余 ${alt.remainingSeats} 位。`,
    });
  }
  return plans;
}

export function buildOverview(opts: {
  stop: string;
  peak: boolean;
  now: number;
  feedback: FeedbackSample[];
}): TransitOverview {
  const { stop, peak, now, feedback } = opts;
  const t = now / 60000;
  const { hour } = localParts(now);
  const closed = !peak && (hour < 6.5 || hour >= 23);
  const demand = demandProfile(hour, peak);

  const routes: RouteOverview[] = [];
  const byRoute: Record<RouteId, ArrivalInfo[]> = { '1': [], '2': [] };
  const refStops = buildStops('1', t, demand);
  const ref = refStops.find((s) => s.name === stop) ?? refStops[10];

  for (const routeId of ROUTE_IDS) {
    const rows = feedback.filter((f) => f.routeId === routeId && f.level in FEEDBACK_TARGET);
    const fb =
      rows.length > 0
        ? rows.reduce((s, r) => s + FEEDBACK_TARGET[r.level as CrowdLevel], 0) / rows.length
        : null;
    const buses = closed ? [] : buildBuses(routeId, t, demand, fb);
    byRoute[routeId] = closed ? [] : buildArrivals(routeId, buses, ref.name, ref.queue);
    routes.push({
      routeId,
      name: ROUTE_META[routeId].name,
      direction: ROUTE_META[routeId].direction,
      stops: buildStops(routeId, t, demand),
      buses,
      arrivals: byRoute[routeId],
    });
  }

  const colleges: CollegeHeat[] = COLLEGE_STOPS.map(({ college, stopName }) => {
    const s = refStops.find((x) => x.name === stopName) ?? refStops[0];
    return { college, stopName, queue: s.queue, ratio: Math.min(1, s.queue / 40), trend: s.trend };
  });

  const advice = buildAdvice(
    closed,
    ref.name,
    ref.queue,
    ref.trend,
    ref.offline,
    ROUTE_IDS.flatMap((r) => byRoute[r]),
    feedback.length,
  );

  return {
    updatedAt: new Date(now).toISOString(),
    closed,
    peakDemo: peak,
    capacity: BUS_CAPACITY,
    selectedStop: { name: ref.name, queue: ref.queue, trend: ref.trend, offline: ref.offline },
    routes,
    colleges,
    advice,
    plans: buildPlans(closed, now, byRoute),
    feedbackCount: feedback.length,
  };
}

export async function loadOverview(stop: string, peak: boolean): Promise<TransitOverview> {
  let feedback: FeedbackSample[] = [];
  try {
    feedback = await feedbackRepository.listSince(new Date(Date.now() - 10 * 60000));
  } catch (error) {
    console.warn('Feedback lookup failed, using sensor-only estimate');
  }
  return buildOverview({ stop, peak, now: Date.now(), feedback });
}

export function describeOverview(o: TransitOverview): string {
  const clock = localParts(new Date(o.updatedAt).getTime()).label;
  const lines: string[] = [
    `当前时间 ${clock}${o.peakDemo ? '（早八高峰演示模式）' : ''}，用户所在站点：${o.selectedStop.name}，本站候车 ${o.selectedStop.queue} 人${o.selectedStop.offline ? '（设备离线，历史估算）' : ''}。`,
  ];
  if (o.closed) {
    lines.push('当前为非运营时段（运营时间 06:30–23:00），暂无班次。');
  } else {
    for (const r of o.routes) {
      const arr = r.arrivals.map(
        (a) =>
          `${a.busId} ${a.etaMin}分钟后到站，车内${a.load}/${BUS_CAPACITY}人（${LEVEL_LABEL[a.level]}），预计剩余${a.remainingSeats}位，${a.verdict === 'likely' ? '大概率能上' : '可能挤不上'}`,
      );
      lines.push(`${r.name}（${r.direction}）下一班：${arr.join('；')}`);
    }
  }
  lines.push(`各书院站点候车：${o.colleges.map((c) => `${c.college}${c.queue}人`).join('、')}。`);
  lines.push(`规则引擎建议：${o.advice.title}。${o.advice.summary}（置信度 ${Math.round(o.advice.confidence * 100)}%）`);
  if (o.plans.length) lines.push(`备选方案：${o.plans.map((p) => p.title).join('；')}`);
  lines.push(`1 路站序：${ROUTE_STOPS['1'].join('→')}（再回沁园）`);
  lines.push(`2 路站序：${ROUTE_STOPS['2'].join('→')}（再回沁园）`);
  return lines.join('\n');
}
