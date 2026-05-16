import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-for-tests'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

// ── Senha ──────────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

// ── Token ──────────────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string        // userId
  email: string
  role: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET)
  return decoded as TokenPayload
}
