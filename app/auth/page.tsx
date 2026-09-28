'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

export default function AuthPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Account created. Please check your email and confirm your account before signing in.'
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        window.location.href = '/'
      }
    }

    setLoading(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#f7f9fc',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'white',
          border: '1px solid #dfe6ee',
          borderRadius: '18px',
          padding: '32px',
          boxShadow: '0 18px 50px rgba(16,24,40,.09)',
        }}
      >
        <h1 style={{ marginTop: 0 }}>TechNova Academy</h1>

        <h2>{mode === 'login' ? 'Student Login' : 'Create Student Account'}</h2>

        <p style={{ color: '#5f6b7a' }}>
          {mode === 'login'
            ? 'Sign in to continue learning.'
            : 'Create your TechNova Academy student account.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label style={{ display: 'block', marginBottom: '16px' }}>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '6px',
                  border: '1px solid #dfe6ee',
                  borderRadius: '8px',
                }}
              />
            </label>
          )}

          <label style={{ display: 'block', marginBottom: '16px' }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '6px',
                border: '1px solid #dfe6ee',
                borderRadius: '8px',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '16px' }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '6px',
                border: '1px solid #dfe6ee',
                borderRadius: '8px',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              border: 0,
              borderRadius: '8px',
              background: '#315ee7',
              color: 'white',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: '18px',
              padding: '12px',
              background: '#eef3f8',
              borderRadius: '8px',
              color: '#334155',
            }}
          >
            {message}
          </p>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {mode === 'login' ? (
            <button
              onClick={() => {
                setMode('register')
                setMessage('')
              }}
              style={{
                border: 0,
                background: 'transparent',
                color: '#315ee7',
                cursor: 'pointer',
              }}
            >
              Create a new account
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('login')
                setMessage('')
              }}
              style={{
                border: 0,
                background: 'transparent',
                color: '#315ee7',
                cursor: 'pointer',
              }}
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </main>
  )
}