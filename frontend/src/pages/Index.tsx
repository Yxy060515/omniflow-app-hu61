import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Home, LogOut, MessageSquare, Route as RouteIcon } from 'lucide-react';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { useLocalStorage } from '@/hooks/use-localStorage';
import { apiService } from '@/lib/api';
import { DEFAULT_STOP } from '@shared/campus';
import type { TransitOverview } from '@shared/types/transit';
import HomeView from './HomeView';
import RouteView from './RouteView';
import AssistantView from './AssistantView';

type ViewKey = 'home' | 'routes' | 'assistant';

const NAV_ITEMS: { key: ViewKey; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: '我的站点', Icon: Home },
  { key: 'routes', label: '线路总览', Icon: RouteIcon },
  { key: 'assistant', label: 'AI 助手', Icon: MessageSquare },
];

const REFRESH_MS = 15000;

const Index = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [studentId] = useState<string>(() => localStorage.getItem('campus-student-id') ?? '');
  const [view, setView] = useState<ViewKey>('home');
  const [stop, setStop] = useLocalStorage<string>('campus-bus-stop', DEFAULT_STOP);
  const [favorites, setFavorites] = useLocalStorage<string[]>('campus-bus-favorites', []);
  const [peak, setPeak] = useState<boolean>(false);
  const [overview, setOverview] = useState<TransitOverview | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiService.getOverview(stop, peak);
        if (cancelled) return;
        if (res.success) {
          setOverview(res.data);
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stop, peak, reloadKey]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleRetry = () => setReloadKey((k) => k + 1);

  const handleLogout = () => {
    localStorage.removeItem('campus-student-id');
    logout();
    navigate('/login', { replace: true });
  };

  const handleToggleFavorite = (name: string) => {
    setFavorites((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleSelectStop = (name: string) => {
    setStop(name);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Bus className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-base font-bold leading-tight">校园智公交</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-current={view === key ? 'page' : undefined}
                className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors ${view === key ? 'bg-slate-900 text-white' : 'text-foreground hover:bg-accent'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {studentId && (
              <span className="text-xs text-muted-foreground">学号 {studentId}</span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              aria-label="退出登录"
              className="min-h-[44px] cursor-pointer"
            >
              <LogOut className="h-4 w-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:pb-10">
        {view === 'home' && (
          <HomeView
            overview={overview}
            now={now}
            failed={failed}
            stop={stop}
            onStopChange={setStop}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            peak={peak}
            onPeakChange={setPeak}
            onRetry={handleRetry}
          />
        )}
        {view === 'routes' && (
          <RouteView
            overview={overview}
            now={now}
            failed={failed}
            stop={stop}
            onSelectStop={handleSelectStop}
            onRetry={handleRetry}
          />
        )}
        {view === 'assistant' && <AssistantView stop={stop} peak={peak} />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background md:hidden"
        aria-label="底部导航"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-3">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-current={view === key ? 'page' : undefined}
              className={`flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium ${view === key ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <Icon className={`h-5 w-5 ${view === key ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default Index;
