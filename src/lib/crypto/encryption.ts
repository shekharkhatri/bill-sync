// SERVER ONLY — never import this file from a Client Component or client-side code
import crypto from 'node:crypto'
import { ENCRYPTION_KEY } from '@/lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a hex-encoded iv:authTag:ciphertext string.
 */
export function encrypt(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
  } catch {
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypts a previously encrypted string. Throws if the format is
 * invalid or decryption fails (e.g. wrong key or tampered data).
 */
export function decrypt(ciphertext: string): string {
  try {
    const parts = ciphertext.split(':')
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error('Invalid ciphertext format')
    }
    const [ivHex, tagHex, dataHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const encryptedData = Buffer.from(dataHex, 'hex')
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv) as crypto.DecipherGCM
    decipher.setAuthTag(tag.subarray(0, TAG_LENGTH))
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    return decrypted.toString('utf8')
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid ciphertext format') throw err
    throw new Error('Decryption failed')
  }
}

/**
 * Returns a masked version of a token safe for display in the UI.
 */
export function maskToken(token: string): string {
  if (token.length < 8) return '••••••••'
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`
}
