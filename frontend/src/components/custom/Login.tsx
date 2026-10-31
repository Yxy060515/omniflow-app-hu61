import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { apiService } from '@/lib/api';
import { STUDENT_ID_LENGTH, isValidStudentId } from '@shared/auth';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [touched, setTouched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const idInvalid = touched && !isValidStudentId(studentId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (!isValidStudentId(studentId)) return;
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setLoading(true);
    const result = await apiService.login({ studentId, password });
    setLoading(false);
    if (result.ok && result.data) {
      localStorage.setItem('campus-student-id', result.data.user.studentId);
      toast.success('登录成功', { description: `欢迎回来，${result.data.user.name}` });
      login(result.data.token);
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout title="学号登录" subtitle="输入 9 位学号和密码，验证后进入公交主页。">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="student-id">学号</Label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {studentId.length}/{STUDENT_ID_LENGTH}
            </span>
          </div>
          <Input
            id="student-id"
            inputMode="numeric"
            autoComplete="username"
            placeholder="请输入 9 位学号"
            maxLength={STUDENT_ID_LENGTH}
            value={studentId}
            aria-invalid={idInvalid}
            aria-describedby={idInvalid ? 'student-id-error' : undefined}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH))}
            onBlur={() => setTouched(true)}
            className="min-h-[44px]"
          />
          {idInvalid && (
            <p id="student-id-error" className="text-sm text-destructive">
              学号必须为 9 位数字
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-0 top-0 flex h-full w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="min-h-[44px] cursor-pointer">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? '验证中...' : '登录'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          第一次使用？
          <Link to="/signup" className="ml-1 cursor-pointer font-medium text-foreground underline-offset-4 hover:underline">
            用学号注册
          </Link>
        </p>
      </form>
      <Toaster />
    </AuthLayout>
  );
};

export default Login;
