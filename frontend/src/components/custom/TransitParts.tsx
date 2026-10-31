import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Ban,
  Clock,
  Frown,
  Meh,
  Minus,
  Smile,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_LABEL } from '@shared/campus';
import { apiService } from '@/lib/api';
import type { CrowdLevel, RouteId, Trend } from '@shared/types/transit';

const LEVEL_STYLE: Record<CrowdLevel, { Icon: LucideIcon; badge: string; bar: string }> = {
  idle: { Icon: Smile, badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', bar: 'bg-emerald-600' },
  normal: { Icon: Meh, badge: 'bg-amber-100 text-amber-900 border-amber-300', bar: 'bg-amber-500' },
  crowded: { Icon: Frown, badge: 'bg-orange-100 text-orange-900 border-orange-300', bar: 'bg-orange-600' },
  full: { Icon: Ban, badge: 'bg-red-100 text-red-900 border-red-300', bar: 'bg-red-600' },
};

const CLIENT_ID_KEY = 'campus-bus-client-id';

function getClientId(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const created = `c${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 6)}`;
    window.localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return 'anonymous-client';
  }
}

export function CrowdBadge({ level, className = '' }: { level: CrowdLevel; className?: string }) {
  const { Icon, badge } = LEVEL_STYLE[level];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${badge} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {LEVEL_LABEL[level]}
    </span>
  );
}

export function LoadBar({ load, capacity, level }: { load: number; capacity: number; level: CrowdLevel }) {
  const pct = Math.min(100, Math.round((load / capacity) * 100));
  return (
    <div className="w-full">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={load}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`车内 ${load} 人，额定 ${capacity} 人`}
      >
        <div className={`h-full rounded-full ${LEVEL_STYLE[level].bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {load} / {capacity} 人
      </p>
    </div>
  );
}

export function TrendLabel({ trend }: { trend: Trend }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium text-red-700">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        上升
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium text-emerald-700">
        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
        下降
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      持平
    </span>
  );
}

export function Freshness({
  updatedAt,
  now,
  failed,
}: {
  updatedAt: string;
  now: number;
  failed: boolean;
}) {
  const sec = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 1000));
  const stale = sec > 60 || failed;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${stale ? 'font-semibold text-red-700' : 'text-muted-foreground'}`}
    >
      {stale ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
      更新于 {sec} 秒前{stale ? ' · 数据可能过期' : ''}
    </span>
  );
}

const LEVELS: CrowdLevel[] = ['idle', 'normal', 'crowded', 'full'];

export function FeedbackPanel({
  stopName,
  defaultRouteId,
  onSubmitted,
}: {
  stopName: string;
  defaultRouteId: RouteId;
  onSubmitted: () => void;
}) {
  const [routeId, setRouteId] = useState<RouteId>(defaultRouteId);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (level: CrowdLevel) => {
    setSubmitting(true);
    try {
      const res = await apiService.submitFeedback({
        routeId,
        level,
        clientId: getClientId(),
        stopName,
      });
      if (res.success) {
        toast.success('感谢反馈', { description: `已记录 ${routeId} 路「${LEVEL_LABEL[level]}」，将用于校正人数估算` });
        onSubmitted();
      } else {
        toast.error('提交失败', { description: res.message || '请稍后再试' });
      }
    } catch {
      toast.error('网络异常', { description: '请稍后再试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="选择线路">
        {(['1', '2'] as RouteId[]).map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={routeId === r ? 'default' : 'outline'}
            aria-pressed={routeId === r}
            className="min-h-[44px] min-w-[72px] cursor-pointer"
            onClick={() => setRouteId(r)}
          >
            {r} 路
          </Button>
        ))}
        <span className="text-xs text-muted-foreground">所在站点：{stopName}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVELS.map((level) => {
          const { Icon } = LEVEL_STYLE[level];
          return (
            <Button
              key={level}
              type="button"
              variant="outline"
              disabled={submitting}
              className="min-h-[44px] cursor-pointer gap-1.5"
              onClick={() => submit(level)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {LEVEL_LABEL[level]}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">每位用户每条线路 5 分钟内限提交一次，仅记录匿名拥挤等级。</p>
    </div>
  );
}
