import { Bus, CloudOff, RefreshCw, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrowdBadge, Freshness, TrendLabel } from '@/components/custom/TransitParts';
import type { RouteOverview, TransitOverview } from '@shared/types/transit';

interface RouteViewProps {
  overview: TransitOverview | null;
  now: number;
  failed: boolean;
  stop: string;
  onSelectStop: (stop: string) => void;
  onRetry: () => void;
}

function RouteDiagram({
  route,
  stop,
  onSelectStop,
}: {
  route: RouteOverview;
  stop: string;
  onSelectStop: (stop: string) => void;
}) {
  return (
    <ol className="flex flex-col">
      {route.stops.map((s) => {
        const buses = route.buses.filter((b) => Math.floor(b.position) === s.index);
        const selected = s.name === stop;
        return (
          <li key={`${s.name}-${s.index}`} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="relative flex w-6 shrink-0 flex-col items-center">
              <span
                className={`z-10 mt-4 h-3.5 w-3.5 rounded-full border-2 ${selected ? 'border-slate-900 bg-slate-900' : 'border-slate-400 bg-background'}`}
                aria-hidden="true"
              />
              <span className="absolute bottom-[-16px] top-[22px] w-0.5 bg-slate-300" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <button
                type="button"
                onClick={() => onSelectStop(s.name)}
                aria-label={`查看 ${s.name} 站`}
                className={`flex min-h-[44px] w-full cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent ${selected ? 'border-slate-900 bg-accent' : 'bg-card'}`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.name}</span>
                  {s.segment && (
                    <Badge variant="outline" className="whitespace-nowrap">
                      {s.segment === 'outbound' ? '出发段' : '返程段'}
                    </Badge>
                  )}
                  {s.index === 0 && <Badge variant="secondary">起点</Badge>}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  {s.offline ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
                      <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
                      设备离线·估算 {s.queue} 人
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">{s.queue} 人候车</span>
                      <TrendLabel trend={s.trend} />
                    </>
                  )}
                </span>
              </button>
              {buses.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  <Bus className="h-4 w-4" aria-hidden="true" />
                  <span className="font-semibold">{b.id}</span>
                  <span className="text-muted-foreground">
                    {b.load}/{b.capacity} 人 · 驶向 {b.nextStopName}
                  </span>
                  <CrowdBadge level={b.level} />
                </div>
              ))}
            </div>
          </li>
        );
      })}
      <li className="flex items-center gap-3 pl-1 pt-3 text-sm text-muted-foreground">
        <Repeat className="h-4 w-4" aria-hidden="true" />
        下一站回到「{route.stops[0]?.name}」，开始下一圈
      </li>
    </ol>
  );
}

export default function RouteView({ overview, now, failed, stop, onSelectStop, onRetry }: RouteViewProps) {
  if (!overview) {
    return failed ? (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900" role="alert">
        <p className="text-sm">线路数据加载失败。</p>
        <Button type="button" variant="outline" className="min-h-[44px] cursor-pointer" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          重试
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">线路与站点总览</h1>
        <Freshness updatedAt={overview.updatedAt} now={now} failed={failed} />
      </div>
      {overview.closed && (
        <div className="rounded-xl border bg-muted p-4 text-sm">当前非运营时段，暂无车辆运行。可在首页打开「早八高峰演示」。</div>
      )}
      <Tabs defaultValue="1">
        <TabsList className="grid h-auto w-full grid-cols-2">
          {overview.routes.map((r) => (
            <TabsTrigger key={r.routeId} value={r.routeId} className="min-h-[44px] cursor-pointer">
              {r.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {overview.routes.map((r) => (
          <TabsContent key={r.routeId} value={r.routeId} className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              {r.direction} · 运行中车辆 {r.buses.length} 辆 · 点击站点可设为我的站点
            </p>
            {r.buses.length === 0 && !overview.closed && (
              <p className="mb-3 text-sm">当前无运营车辆</p>
            )}
            <RouteDiagram route={r} stop={stop} onSelectStop={onSelectStop} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
