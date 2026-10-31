import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Clock, ShieldCheck, Users } from 'lucide-react';

const POINTS = [
  { Icon: Users, text: '1 路、2 路车内实时人数与拥挤等级' },
  { Icon: Clock, text: '下一班到站时间与剩余空位' },
  { Icon: ShieldCheck, text: '仅使用学号登录，不采集个人影像' },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => (
  <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-2">
    <aside className="hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-900">
          <Bus className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold leading-tight">校园智公交</span>
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="max-w-md text-4xl font-bold leading-tight">
          下一班车还有座位吗？
          <br />
          出门前先看一眼。
        </h2>
        <ul className="flex flex-col gap-4">
          {POINTS.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm leading-relaxed text-slate-200">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-300">早八高峰，让每一次出行更从容。</p>
    </aside>

    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Bus className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-base font-bold leading-tight">校园智公交</span>
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <Link
          to="/preview"
          className="cursor-pointer text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          了解校园智公交
        </Link>
      </div>
    </main>
  </div>
);

export default AuthLayout;
