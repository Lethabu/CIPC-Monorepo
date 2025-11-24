import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { getSession } from '../../src/db';
import { RefreshToken, User } from '../../src/models';
import { select } from 'sqlmodel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not found' });
  }

  const session = getSession();

  try {
    const statement = select(RefreshToken).where(RefreshToken.token === refreshToken);
    const token = await session.exec(statement).oneOrNone();

    if (!token || token.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const userStatement = select(User).where(User.id === token.userId);
    const user = await session.exec(userStatement).one();

    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '15m',
    });

    res.setHeader(
      'Set-Cookie',
      cookie.serialize('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 900, // 15 minutes
        path: '/',
      })
    );

    res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session.close();
  }
}