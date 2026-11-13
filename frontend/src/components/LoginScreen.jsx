import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../api'
import Loading from './Loading'

export default function LoginScreen({ onSignedIn, notice }) {
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleCredential(response) {
    setError('')
    setSigningIn(true)
    try {
      const user = await api('/auth/google', { method: 'POST', body: { credential: response.credential } })
      onSignedIn(user)
    } catch (err) {
      setError(err.status === 0 ? err.message : `Sign-in failed. ${err.message}`)
      setSigningIn(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8 text-center">
      <h1 className="text-3xl font-bold">TaskFlow</h1>
      <p className="mt-2 text-slate-600">A simple personal task list. Sign in to see your tasks.</p>

      {notice && (
        <p role="alert" className="mt-6 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-red-900">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-center">
        {signingIn ? (
          <Loading text="Signing you in…" />
        ) : import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={handleCredential}
            onError={() => setError('Sign-in was cancelled or failed. Please try again.')}
          />
        ) : (
          <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
            Sign-in is not set up: VITE_GOOGLE_CLIENT_ID is missing (see the README).
          </p>
        )}
      </div>
    </main>
  )
}
