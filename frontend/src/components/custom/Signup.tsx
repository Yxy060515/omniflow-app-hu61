import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
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

const Signup = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
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
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    const result = await apiService.signup({
      studentId,
      nickname: nickname.trim() || undefined,
      password,
      confirmPassword,
    });
    setLoading(false);
    if (result.ok && result.data) {
      localStorage.setItem('campus-student-id', result.data.user.studentId);
      toast.success('注册成功', { description: '已为你自动登录' });
      login(result.data.token);
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout title="学号注册" subtitle="使用 9 位学号创建账号，注册后自动登录。">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signup-student-id">学号</Label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              已输入 {studentId.length}/{STUDENT_ID_LENGTH} 位
            </span>
          </div>
          <Input
            id="signup-student-id"
            type="text"
            inputMode="numeric"
            pattern="\d{9}"
            autoComplete="username"
            placeholder="请输入 9 位数字学号"
            maxLength={STUDENT_ID_LENGTH}
            value={studentId}
            aria-invalid={idInvalid}
            aria-describedby={idInvalid ? 'signup-student-id-error' : undefined}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, STUDENT_ID_LENGTH))}
            onBlur={() => setTouched(true)}
            className="min-h-[44px]"
          />
          {idInvalid && (
            <p id="signup-student-id-error" className="text-sm text-destructive">
              {studentId.length === 0 ? '请输入学号' : `学号须为 9 位数字，当前已输入 ${studentId.length} 位`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nickname">昵称（选填）</Label>
          <Input
            id="nickname"
            placeholder="不填则自动生成"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password">密码</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="至少 6 位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">确认密码</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        <Button type="submit" disabled={loading} className="min-h-[44px] cursor-pointer">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? '注册中...' : '注册并登录'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          已有账号？
          <Link to="/login" className="ml-1 cursor-pointer font-medium text-foreground underline-offset-4 hover:underline">
            返回登录
          </Link>
        </p>
      </form>
      <Toaster />
    </AuthLayout>
  );
};

export default Signup;
