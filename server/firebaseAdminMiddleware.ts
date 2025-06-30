// Firebase-based admin middleware for Express
import { adminDb } from './firebaseAdmin';
import type { Request, Response, NextFunction } from 'express';

export async function firebaseAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Ambil userId dari header atau query (harus sudah login di frontend)
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ message: 'User authentication required' });
    }
    // Ambil user dari Firestore
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return res.status(401).json({ message: 'User not found' });
    }
    const user = userSnap.data();
    if (user.role !== 'admin' && user.role !== 'developer') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = { ...user, id: userId };
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
