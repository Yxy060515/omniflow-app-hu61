import { useLocation, useNavigate } from 'react-router-dom';
import { Bus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 text-center text-foreground">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
        <Bus className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold leading-tight">页面不存在</h1>
      <p className="max-w-sm break-all text-sm leading-relaxed text-muted-foreground">
        没有找到页面 {location.pathname}，你可以回到首页查看下一班车的拥挤情况。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="min-h-[44px] cursor-pointer" onClick={() => navigate('/')}>
          <Home className="mr-1 h-4 w-4" aria-hidden="true" />
          返回首页
        </Button>
        <Button variant="outline" className="min-h-[44px] cursor-pointer" onClick={() => navigate('/preview')}>
          查看产品介绍
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
