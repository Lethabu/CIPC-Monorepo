import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { getSession } from '../../src/db';
import { User } from '../../src/models';

const saltRounds = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const session = getSession();

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ email, password: hashedPassword });

    session.add(user);
    await session.commit();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  } finally {
    session.close();
  }
}
