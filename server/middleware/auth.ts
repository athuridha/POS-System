import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  nama: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from Authorization header.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
    return;
  }
}

/**
 * Role-based authorization middleware.
 * Must be used AFTER authenticate middleware.
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Tidak terautentikasi' });
      return;
    }

    if (req.user.role !== 'super_admin' && !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Tidak memiliki akses untuk operasi ini' });
      return;
    }

    next();
  };
}
