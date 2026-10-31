import { API_BASE_URL } from '@/config/constants';
import type {
  ApiResponse,
  AuthErrorBody,
  AuthOutcome,
  AuthResult,
  StudentLoginRequest,
  StudentSignupRequest,
} from '@shared/types/api';
import type {
  ChatRequest,
  FeedbackResult,
  SubmitFeedbackRequest,
  TransitOverview,
} from '@shared/types/transit';

class ApiService {
  private async authRequest(path: string, body: object): Promise<AuthOutcome> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => null)) as
        | (ApiResponse<AuthResult> & AuthErrorBody)
        | null;
      if (response.ok && json && json.success && json.data?.token) {
        return { ok: true, message: '', data: json.data };
      }
      if (response.status === 401) return { ok: false, message: '学号或密码错误', data: null };
      if (response.status === 409) return { ok: false, message: '该学号已注册，请直接登录', data: null };
      if (response.status === 400 && json?.error?.message) {
        return { ok: false, message: json.error.message, data: null };
      }
      return { ok: false, message: '服务暂时不可用，请稍后重试', data: null };
    } catch {
      return { ok: false, message: '网络异常，请检查网络后重试', data: null };
    }
  }

  login(body: StudentLoginRequest): Promise<AuthOutcome> {
    return this.authRequest('login', body);
  }

  signup(body: StudentSignupRequest): Promise<AuthOutcome> {
    return this.authRequest('signup', body);
  }

  async getOverview(stop: string, peak: boolean): Promise<ApiResponse<TransitOverview>> {
    const query = `stop=${encodeURIComponent(stop)}&peak=${peak ? '1' : '0'}`;
    const response = await fetch(`${API_BASE_URL}/api/transit/overview?${query}`);
    if (!response.ok) {
      throw new Error(`overview request failed: ${response.status}`);
    }
    return response.json() as Promise<ApiResponse<TransitOverview>>;
  }

  async submitFeedback(body: SubmitFeedbackRequest): Promise<ApiResponse<FeedbackResult | null>> {
    const response = await fetch(`${API_BASE_URL}/api/transit/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json() as Promise<ApiResponse<FeedbackResult | null>>;
  }

  async streamChat(
    body: ChatRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/transit/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      throw new Error(`chat request failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error('chat response has no body');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const handleLine = (line: string): boolean => {
      if (!line.startsWith('data: ')) return false;
      const data = line.slice(6);
      if (data === '[DONE]') return true;
      try {
        const parsed = JSON.parse(data) as { content?: string };
        if (parsed.content) onChunk(parsed.content);
      } catch {
        console.warn('Failed to parse SSE data:', data);
      }
      return false;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        if (buffer) handleLine(buffer.trim());
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (handleLine(line)) return;
      }
    }
  }
}

export const apiService = new ApiService();
