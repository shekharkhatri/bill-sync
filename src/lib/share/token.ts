// SERVER ONLY — never import from Client Components

import { randomBytes } from 'node:crypto'

/**
 * Generates a cryptographically secure URL-safe token.
 * 43 chars, ~256 bits of entropy. Safe for use in public URLs.
 */
export function generateShareToken(): string {
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Returns true if the token has passed its expiry date.
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (expiresAt === null) return false
  return new Date() > expiresAt
}
