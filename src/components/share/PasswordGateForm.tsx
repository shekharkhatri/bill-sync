'use client'

import { useState, type KeyboardEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordGateFormProps {
  token: string
}

export default function PasswordGateForm({ token }: PasswordGateFormProps): React.ReactElement {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(): Promise<void> {
    if (!password.trim() || isSubmitting) return
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/share/${token}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        window.location.href = `/share/${token}`
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Incorrect password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      void handleSubmit()
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter password"
          disabled={isSubmitting}
          autoFocus
          className="h-9 pr-9 text-sm"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      {error && (
        <p className="text-[13px] text-destructive">{error}</p>
      )}

      <Button
        onClick={() => void handleSubmit()}
        disabled={isSubmitting || !password.trim()}
        className="w-full h-9 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            Verifying…
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  )
}
