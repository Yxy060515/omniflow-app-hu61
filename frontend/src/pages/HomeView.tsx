import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  CloudOff,
  Footprints,
  MapPin,
  RefreshCw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STOP_NAMES } from '@shared/campus';
import {
  CrowdBadge,
  FeedbackPanel,
  Freshness,
  LoadBar,
  TrendLabel,
} from '@/components/custom/TransitParts';
import type { AdviceAction, TransitOverview } from '@shared/types/transit';

interface HomeViewProps {
  overview: TransitOverview | null;
  now: number;
  failed: boolean;
  stop: string;
  onStopChange: (stop: string) => void;
  favorites: string[];
  onToggleFavorite: (stop: string) => void;
  peak: boolean;
  onPeakChange: (peak: boolean) => void;
  onRetry: () => void;
}

const ACTION_STYLE: Record<AdviceAction, string> = {
  go_now: 'bg-emerald-700 text-white',
  wait: 'bg-sky-800 text-white',
  switch_route: 'bg-amber-700 text-white',
  walk: 'bg-red-800 text-white',
  closed: 'bg-slate-700 text-white',
};

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="加载中">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export default function HomeView({
  overview,
  now,
  failed,
  stop,
  onStopChange,
  favorites,
  onToggleFavorite,
  peak,
  onPeakChange,
  onRetry,
}: HomeViewProps) {
  const isFav = favorites.includes(stop);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-sm text-slate-300">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              我的站点
            </p>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{stop}</h1>
            {overview && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-200">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  候车 {overview.selectedStop.queue} 人
                </span>
                {!overview.selectedStop.offline && (
                  <span className="rounded bg-white/90 px-1.5 py-0.5">
                    <TrendLabel trend={overview.selectedStop.trend} />
                  </span>
                )}
                {overview.selectedStop.offline && (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <CloudOff className="h-4 w-4" aria-hidden="true" />
                    设备离线，数据由历史估算
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <div className="flex items-center gap-2">
              <Select value={stop} onValueChange={onStopChange}>
                <SelectTrigger
                  className="min-h-[44px] flex-1 border-white/30 bg-white text-slate-900"
                  aria-label="选择站点"
                >
                  <SelectValue placeholder="选择站点" />
                </SelectTrigger>
                <SelectContent>
                  {STOP_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="min-h-[44px] min-w-[44px] cursor-pointer"
                aria-pressed={isFav}
                aria-label={isFav ? '取消收藏站点' : '收藏站点'}
                onClick={() => onToggleFavorite(stop)}
              >
                <Star className={`h-5 w-5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
              </Button>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-200">
              早八高峰演示
              <Switch checked={peak} onCheckedChange={(v) => onPeakChange(v as boolean)} aria-label="早八高峰演示" />
            </label>
          </div>
        </div>
        {favorites.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">常用：</span>
            {favorites.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onStopChange(name)}
                aria-pressed={name === stop}
                className={`min-h-[36px] cursor-pointer rounded-full px-3 text-sm transition-colors ${name === stop ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {overview && (
          <div className="mt-4 rounded bg-white/90 px-2 py-1 sm:inline-block">
            <Freshness updatedAt={overview.updatedAt} now={now} failed={failed} />
          </div>
        )}
      </section>

      {failed && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {overview ? '网络不稳定，已显示最近一次缓存数据' : '数据加载失败'}
          </p>
          <Button type="button" size="sm" variant="outline" className="min-h-[44px] cursor-pointer" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            重试
          </Button>
        </div>
      )}

      {!overview && !failed && <HomeSkeleton />}

      {overview && (
        <>
          <Card className="overflow-hidden">
            <CardHeader className={`${ACTION_STYLE[overview.advice.action]} p-5`}>
              <CardTitle className="flex flex-wrap items-center gap-2 text-xl leading-tight">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                AI 出行建议：{overview.advice.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-5">
              <p className="text-base leading-relaxed">{overview.advice.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">置信度 {Math.round(overview.advice.confidence * 100)}%</Badge>
                {overview.advice.simplified && <Badge variant="secondary">简化建议</Badge>}
                {overview.advice.lowConfidence && (
                  <Badge variant="destructive">置信度低，仅供参考</Badge>
                )}
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">建议依据的实时数据</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {overview.advice.basis.map((b) => (
                    <li key={b.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                      <span className="font-medium sm:w-32 sm:shrink-0">{b.label}</span>
                      <span className="text-muted-foreground">{b.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3" aria-label="下一班到站">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Bus className="h-5 w-5" aria-hidden="true" />
              下一班到站与剩余容量
            </h2>
            {overview.closed ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">当前非运营时段，暂无班次。</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {overview.routes.map((route) => (
                  <Card key={route.routeId}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{route.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">{route.direction}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-4 pt-2">
                      {route.arrivals.map((a, idx) => (
                        <div key={a.busId} className="flex min-h-[120px] flex-col gap-2 rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {idx === 0 ? '下一班' : '再下一班'} · {a.busId}
                            </p>
                            <CrowdBadge level={a.level} />
                          </div>
                          <p className="text-2xl font-bold leading-tight">
                            {a.etaMin} <span className="text-sm font-medium text-muted-foreground">分钟 · 还有 {a.stopsAway} 站</span>
                          </p>
                          <LoadBar load={a.load} capacity={overview.capacity} level={a.level} />
                          <p className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span>预计剩余 {a.remainingSeats} 位</span>
                            {a.verdict === 'likely' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                大概率能上
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-800">
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                可能挤不上
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {overview.plans.length > 0 && (
            <section className="flex flex-col gap-3" aria-label="出行方案">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Footprints className="h-5 w-5" aria-hidden="true" />
                推荐出行方案
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {overview.plans.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex min-h-[120px] flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-tight">{p.title}</p>
                        <CrowdBadge level={p.level} />
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{p.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3" aria-label="各书院候车人数">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5" aria-hidden="true" />
              宿舍区候车人数
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {overview.colleges.map((c) => (
                <button
                  key={c.college}
                  type="button"
                  onClick={() => onStopChange(c.stopName)}
                  className="flex min-h-[96px] cursor-pointer flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-semibold">{c.college}</span>
                  <span className="text-2xl font-bold leading-tight">{c.queue} <span className="text-xs font-medium text-muted-foreground">人</span></span>
                  <TrendLabel trend={c.trend} />
                </button>
              ))}
            </div>
          </section>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">一键上报真实拥挤情况</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <FeedbackPanel stopName={stop} defaultRouteId="1" onSubmitted={onRetry} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
