import { Router, Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/users';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  STUDENT_ID_PATTERN,
  emailToStudentId,
  studentIdToEmail,
} from '../../shared/auth';
import { JWT_CONFIG, AUTH_ERRORS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';
import { authenticateLocal, authenticateJWT } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const userRepo = new UserRepository();

const studentIdField = z
  .string({ required_error: '请输入学号' })
  .regex(STUDENT_ID_PATTERN, '学号必须为 9 位数字');

const studentLoginSchema = z.object({
  studentId: studentIdField,
  password: z.string({ required_error: '请输入密码' }).min(6, '密码至少 6 位'),
});

const studentSignupSchema = z
  .object({
    studentId: studentIdField,
    nickname: z.string().trim().max(20, '昵称最多 20 个字符').optional(),
    password: z.string({ required_error: '请输入密码' }).min(6, '密码至少 6 位'),
    confirmPassword: z.string({ required_error: '请再次输入密码' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

// Validates the 9-digit student ID and maps it to the email field used by passport-local
const prepareStudentLogin = (req: Request, _res: Response, next: NextFunction) => {
  const parsed = studentLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new AppError(parsed.error.issues[0]?.message ?? '请求参数有误', 400, 'VALIDATION_ERROR'),
    );
  }
  req.body = {
    email: studentIdToEmail(parsed.data.studentId),
    password: parsed.data.password,
  };
  return next();
};

// Signup route
const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = studentSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? '请求参数有误',
        400,
        'VALIDATION_ERROR',
      );
    }
    const { studentId, nickname, password } = parsed.data;
    const email = studentIdToEmail(studentId);

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError(AUTH_ERRORS.EMAIL_ALREADY_EXISTS, 409, 'STUDENT_EXISTS');
    }

    const user = await userRepo.create({
      email,
      password,
      name: nickname && nickname.length > 0 ? nickname : `同学${studentId.slice(-4)}`,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        message: 'Signup successful',
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login route
const loginHandler = (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const token = generateToken(user);

  res.json({
    success: true,
    data: {
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    },
  });
};

// Get current user
const getCurrentUser = (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
    },
  });
};

// Helper functions
const generateToken = (user: any) => {
  const jwtSecret = JWT_CONFIG.SECRET || JWT_CONFIG.FALLBACK_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required for authentication');
  }
  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

const sanitizeUser = (user: any) => ({
  id: user.id as string,
  studentId: emailToStudentId(user.email as string),
  name: user.name as string,
});

// Routes
router.post('/signup', signupHandler);
router.post('/login', prepareStudentLogin, authenticateLocal, loginHandler);
router.get('/me', authenticateJWT, getCurrentUser);

export default router;
