// SERVER ONLY — never import from Client Components
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/** Hashes a plaintext password with bcrypt. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * Returns false on any error (invalid hash format, etc.).
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

/** Generates a cryptographically random 8-character base64url password. */
export function generatePassword(): string {
  return randomBytes(6).toString('base64url').substring(0, 8)
}
