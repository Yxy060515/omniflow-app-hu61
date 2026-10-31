import type { CrowdLevel, RouteId } from './types/transit';

export const BUS_CAPACITY = 60;

export const ROUTE_META: Record<RouteId, { name: string; direction: string }> = {
  '1': { name: '1 路', direction: '环线 · 顺向' },
  '2': { name: '2 路', direction: '环线 · 反向' },
};

// Each list is one full loop; the loop closes by returning to the first stop (沁园).
export const ROUTE_STOPS: Record<RouteId, string[]> = {
  '1': [
    '沁园',
    '中和楼',
    '南门北',
    '敏行楼',
    '敏达楼',
    '澄园南',
    '澄园北',
    '泽园餐厅',
    '泽园南',
    '竹苑',
    '润园',
    '润园餐厅',
    '竞慧楼',
    '竞秀楼',
    '南门西',
    '南门南',
    '中和楼',
  ],
  '2': [
    '沁园',
    '中和楼',
    '南门北',
    '竞秀楼',
    '竞慧楼',
    '润园餐厅',
    '润园',
    '竹苑',
    '泽园南',
    '泽园餐厅',
    '澄园北',
    '澄园南',
    '敏达楼',
    '敏行楼',
    '南门西',
    '南门南',
    '中和楼',
  ],
};

export const STOP_NAMES: string[] = [
  '沁园',
  '润园',
  '泽园南',
  '澄园南',
  '竹苑',
  '泽园餐厅',
  '润园餐厅',
  '澄园北',
  '敏行楼',
  '敏达楼',
  '竞慧楼',
  '竞秀楼',
  '中和楼',
  '南门北',
  '南门西',
  '南门南',
];

export const DEFAULT_STOP = '润园';

export const COLLEGE_STOPS: { college: string; stopName: string }[] = [
  { college: '沁园', stopName: '沁园' },
  { college: '润园', stopName: '润园' },
  { college: '泽园', stopName: '泽园南' },
  { college: '澄园', stopName: '澄园南' },
];

export const LEVEL_LABEL: Record<CrowdLevel, string> = {
  idle: '空闲',
  normal: '一般',
  crowded: '拥挤',
  full: '已满',
};

export function levelFromRatio(ratio: number): CrowdLevel {
  if (ratio < 0.4) return 'idle';
  if (ratio < 0.7) return 'normal';
  if (ratio < 0.9) return 'crowded';
  return 'full';
}
