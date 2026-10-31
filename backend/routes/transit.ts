import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DEFAULT_STOP, STOP_NAMES } from '../../shared/campus';
import type { ApiResponse } from '../../shared/types/api';
import type { FeedbackResult, TransitOverview } from '../../shared/types/transit';
import { createAIService } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import { describeOverview, loadOverview } from '../services/transitService';
import { feedbackRepository } from '../repositories/feedbackRepository';

const router = Router();

const RATE_LIMIT_MS = 5 * 60 * 1000;

const feedbackSchema = z.object({
  routeId: z.enum(['1', '2']),
  level: z.enum(['idle', 'normal', 'crowded', 'full']),
  clientId: z.string().min(6).max(64),
  stopName: z.string().max(20).optional(),
  busId: z.string().max(20).optional(),
});

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1000),
      }),
    )
    .min(1)
    .max(30),
  stop: z.string().max(20).optional(),
  peak: z.boolean().optional(),
});

function normalizeStop(value: unknown): string {
  return typeof value === 'string' && STOP_NAMES.includes(value) ? value : DEFAULT_STOP;
}

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const stop = normalizeStop(req.query.stop);
    const peak = req.query.peak === '1';
    const data = await loadOverview(stop, peak);
    res.json({ success: true, data } as ApiResponse<TransitOverview>);
  } catch (error) {
    console.error('Error in GET /transit/overview:', error);
    res.status(500).json({ success: false, data: null, message: '数据加载失败' });
  }
});

router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: '反馈内容不合法' });
    }
    const input = parsed.data;
    const since = new Date(Date.now() - RATE_LIMIT_MS);
    const recent = await feedbackRepository.findRecentByClient(input.clientId, input.routeId, since);
    const sameTarget = recent.find((r) => (r.busId ?? '') === (input.busId ?? ''));
    if (sameTarget) {
      const waitSec = Math.max(
        1,
        Math.ceil((sameTarget.createdAt.getTime() + RATE_LIMIT_MS - Date.now()) / 1000),
      );
      return res.status(429).json({
        success: false,
        data: null,
        message: `提交过于频繁，请 ${waitSec} 秒后再试`,
      });
    }
    const row = await feedbackRepository.create({
      clientId: input.clientId as string,
      routeId: input.routeId as string,
      level: input.level as string,
      busId: input.busId,
      stopName: input.stopName,
    });
    const data: FeedbackResult = {
      id: row.id,
      level: input.level,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
    return res.json({ success: true, data } as ApiResponse<FeedbackResult>);
  } catch (error) {
    console.error('Error in POST /transit/feedback:', error);
    return res.status(500).json({ success: false, data: null, message: '提交失败，请稍后再试' });
  }
});

const SYSTEM_RULES = [
  '你是「校园智公交」的出行助手，只回答校园公交 1 路、2 路相关的问题（到站时间、车内拥挤度、站点候车人数、出行建议、线路站点）。',
  '必须基于下方【实时数据】回答，给出明确结论（现在出发 / 等下一班 / 换线路 / 步行），并简要说明依据；不要编造数据中没有的信息。',
  '数据以用户所在站点为准；如用户提到其他站点，请提示数据仅覆盖其所在站点，并建议在首页切换站点。',
  '如果无法识别用户说的站点，请列出全部站点供其选择。与校园公交无关的问题请礼貌拒绝并引导回公交话题。',
  '回答使用简体中文，控制在 150 字以内，语气友好简洁。',
].join('\n');

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, data: null, message: '消息不合法' });
    }
    const { messages, peak } = parsed.data;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const text = lastUser ? lastUser.content : '';
    const mentioned = STOP_NAMES.map((n) => ({ n, i: text.indexOf(n) }))
      .filter((x) => x.i >= 0)
      .sort((a, b) => a.i - b.i)[0];
    const stop = mentioned ? mentioned.n : normalizeStop(parsed.data.stop);
    const overview = await loadOverview(stop, Boolean(peak));

    const systemPrompt = `${SYSTEM_RULES}\n\n全部站点：${STOP_NAMES.join('、')}\n\n【实时数据】\n${describeOverview(overview)}`;
    const history: ChatMessage[] = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const aiService = createAIService();
    const appLink = req.get('Referer') || req.get('Origin') || `${req.protocol}://${req.get('host')}`;

    await new Promise((resolve) => setTimeout(resolve, 50));
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    let sent = false;
    try {
      const stream = aiService.chatCompletionStream({
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        appLink,
      });
      for await (const chunk of stream) {
        if (clientDisconnected || res.writableEnded) break;
        sent = true;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    } catch (error) {
      console.error('AI chat stream failed, using rule-based fallback:', error);
    }

    if (!sent && !res.writableEnded) {
      const fallback = `【简化建议】${overview.advice.title}。${overview.advice.summary}`;
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    }
    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n');
      res.end();
    }
    return undefined;
  } catch (error) {
    console.error('Error in POST /transit/chat:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, data: null, message: '助手暂时不可用' });
    }
    res.end();
    return undefined;
  }
});

export default router;
