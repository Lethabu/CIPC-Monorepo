import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcrypt';
import { getSession } from '../../src/db';
import { User, RefreshToken } from '../../src/models';
import { select } from 'sqlmodel';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-default-refresh-secret';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token: recaptchaToken, email, password } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'Missing reCAPTCHA token' });
  }

  const session = getSession();

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.RECAPTCHA_PROJECT_ID}/assessments?key=${process.env.RECAPTCHA_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: {
            token: recaptchaToken,
            siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
            expectedAction: 'login',
          },
        }),
      }
    );

    const data = await response.json();

    // Interpret the reCAPTCHA score
    if (data.riskAnalysis && data.riskAnalysis.score >= 0.7) {
      // High score, likely a human
      const statement = select(User).where(User.email === email);
      const user = await session.exec(statement).oneOrNone();

      if (user && (await bcrypt.compare(password, user.password))) {
        const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
          expiresIn: '15m',
        });
        const refreshToken = randomBytes(64).toString('hex');

        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

        const newRefreshToken = new RefreshToken({
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiry,
        });

        session.add(newRefreshToken);
        await session.commit();

        res.setHeader('Set-Cookie', [
          cookie.serialize('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 900, // 15 minutes
            path: '/',
          }),
          cookie.serialize('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 604800, // 7 days
            path: '/',
          }),
        ]);

        res.status(200).json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Low score, likely a bot
      res.status(400).json({ message: 'Login failed: reCAPTCHA verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session.close();
  }
}