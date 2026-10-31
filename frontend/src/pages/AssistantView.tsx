import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/api';
import type { ChatTurn } from '@shared/types/transit';

interface AssistantViewProps {
  stop: string;
  peak: boolean;
}

const SUGGESTIONS = [
  '我在润园，8:00 要到敏行楼，怎么走？',
  '沁园现在还有空位吗？',
  '1 路和 2 路哪个现在更空？',
  '泽园南的下一班车什么时候到？',
];

export default function AssistantView({ stop, peak }: AssistantViewProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const history: ChatTurn[] = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    try {
      await apiService.streamChat({ messages: history, stop, peak }, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next[next.length - 1] = { role: 'assistant', content: '助手暂时不可用，请稍后再试，或查看首页的简化建议。' };
        }
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
          AI 出行助手
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          用自然语言提问，助手会结合「{stop}」站的实时人数给出结论。仅回答校园公交相关问题。
        </p>
      </div>

      <div
        className="flex min-h-[320px] flex-col gap-3 rounded-xl border bg-card p-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col justify-center gap-3">
            <p className="text-sm text-muted-foreground">试试这些问法：</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="min-h-[44px] cursor-pointer rounded-full border bg-background px-4 text-left text-sm transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-900 text-white'}`}
              aria-hidden="true"
            >
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </span>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            >
              {m.content || (sending && i === messages.length - 1 ? '思考中…' : '')}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="例如：我在润园，8:00 要到敏行楼，怎么走？"
          aria-label="输入问题"
          className="min-h-[44px] flex-1 resize-none"
          rows={2}
          maxLength={300}
        />
        <Button type="submit" disabled={sending || !input.trim()} className="min-h-[44px] min-w-[44px] cursor-pointer" aria-label="发送">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
