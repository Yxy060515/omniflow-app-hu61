import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Clock, MessageSquare, Route as RouteIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HIGHLIGHTS = [
  { Icon: Users, title: '车内实时人数', desc: '1 路、2 路每辆车的载客人数与拥挤等级，图标、文字、颜色三重标识。' },
  { Icon: Clock, title: '下一班与剩余空位', desc: '预计到站时间、预计剩余空位，并与本站候车人数对比判断能否上车。' },
  { Icon: RouteIcon, title: '线路与站点总览', desc: '16 个站点、双线路环线图，中和楼区分出发段与返程段。' },
  { Icon: MessageSquare, title: 'AI 出行建议', desc: '现在出发、等下一班、换线路或步行，并展示依据数据与置信度。' },
];

const Preview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Bus className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-bold leading-tight">校园智公交</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-medium text-muted-foreground">早八出行，先看车再出门</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            下一班车还有座位吗？
            <br />
            打开就知道。
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            实时查看校园公交 1 路、2 路的车内人数、各站候车人数，并获得带依据的 AI 出行建议。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="min-h-[44px] cursor-pointer" onClick={() => navigate('/')}>
              进入应用
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2" aria-label="功能亮点">
          {HIGHLIGHTS.map(({ Icon, title, desc }) => (
            <Card key={title} className="min-h-[120px]">
              <CardContent className="flex h-full flex-col gap-2 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold leading-tight">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Preview;
