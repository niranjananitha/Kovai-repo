import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff } from 'lucide-react'
import { api } from '../api'
import {
  PASSWORD_MIN,
  validateEmail,
  validateLoginPassword,
  validateName,
  validatePassword,
} from '../validation'
import BoardIllustration from './BoardIllustration'
import Loading from './Loading'
import Logo from './Logo'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
const COOLDOWN_MS = 5000

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export default function AuthScreen({ onSignedIn, notice }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({}) // per-field messages
  const [formError, setFormError] = useState('') // message above the form
  const [hint, setHint] = useState('') // extra advice under formError
  const [busy, setBusy] = useState(false)
  const [coolingDown, setCoolingDown] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false) // show the "Sign in instead" link

  const isRegister = mode === 'register'

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setEmailTaken(false)
    setFormError('')
    setHint('')
    setPassword('') // the email stays, so "Sign in instead" does not lose what was typed
  }

  function clearError(field) {
    setErrors((current) => ({ ...current, [field]: '' }))
    if (field === 'email') setEmailTaken(false)
  }

  // Runs a sign-in request and turns every kind of failure into plain language.
  async function run(request) {
    setFormError('')
    setHint('')
    setBusy(true)
    try {
      onSignedIn(await request())
    } catch (err) {
      setBusy(false)
      if (err.code === 'email_taken') {
        setErrors({ email: err.message })
        setEmailTaken(true)
      } else if (err.code === 'invalid_credentials') {
        setFormError(err.message)
        setHint('If you signed up with Google, use Continue with Google.')
      } else if (err.code === 'too_many_attempts') {
        setFormError(err.message)
        setCoolingDown(true)
        setTimeout(() => setCoolingDown(false), COOLDOWN_MS)
      } else {
        setFormError(err.message)
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (busy || coolingDown) return

    // Checked here for convenience; the server checks everything again.
    const found = isRegister
      ? {
          name: validateName(name),
          email: validateEmail(email),
          password: validatePassword(password, email),
        }
      : { email: validateEmail(email), password: validateLoginPassword(password) }
    setErrors(found)
    if (Object.values(found).some(Boolean)) return

    const body = isRegister ? { name, email, password } : { email, password }
    run(() => api(isRegister ? '/auth/register' : '/auth/login', { method: 'POST', body }))
  }

  const passwordLongEnough = password.length >= PASSWORD_MIN

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-muted">Your tasks, in one calm place.</p>

          <div role="tablist" aria-label="Sign in or create account" className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-line/60 p-1">
            {[
              ['signin', 'Sign in'],
              ['register', 'Create account'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`min-h-11 rounded-md text-sm font-medium ${mode === value ? 'bg-surface font-bold shadow-sm' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {notice && (
            <p role="alert" className="mt-4 rounded-lg border border-accent bg-accent/15 p-3 text-sm">
              {notice}
            </p>
          )}
          {formError && (
            <div role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              <p className="font-medium">{formError}</p>
              {hint && <p className="mt-1 text-ink">{hint}</p>}
            </div>
          )}

          {busy ? (
            <Loading text={isRegister ? 'Creating your account…' : 'Signing you in…'} />
          ) : (
            <form onSubmit={handleSubmit} noValidate role="tabpanel" className="mt-4 space-y-4">
              {isRegister && (
                <Field id="auth-name" label="Name" error={errors.name}>
                  <input
                    id="auth-name"
                    className="field"
                    autoComplete="name"
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'auth-name-error' : undefined}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearError('name')
                    }}
                  />
                </Field>
              )}

              <Field id="auth-email" label="Email" error={errors.email}>
                <input
                  id="auth-email"
                  type="email"
                  className="field"
                  autoComplete="email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'auth-email-error' : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError('email')
                  }}
                />
                {emailTaken && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="mt-1 min-h-11 text-sm font-bold underline underline-offset-2"
                  >
                    Sign in instead
                  </button>
                )}
              </Field>

              <Field id="auth-password" label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="field pr-12"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'auth-password-error' : isRegister ? 'auth-password-hint' : undefined}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearError('password')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isRegister && (
                  <p id="auth-password-hint" className="mt-1 text-sm text-muted">
                    <span aria-hidden="true">{passwordLongEnough ? '●' : '○'} </span>
                    {PASSWORD_MIN}+ characters
                    {passwordLongEnough ? ' (done)' : ''}
                  </p>
                )}
              </Field>

              <button type="submit" disabled={coolingDown} className="btn btn-primary w-full">
                {coolingDown ? 'Please wait a moment…' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>
          )}

          {GOOGLE_ENABLED && !busy && (
            <>
              <div className="my-5 flex items-center gap-3 text-sm text-muted" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  text="continue_with"
                  onSuccess={(response) =>
                    run(() => api('/auth/google', { method: 'POST', body: { credential: response.credential } }))
                  }
                  onError={() => setFormError('Sign-in was cancelled or failed. Please try again.')}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <aside className="on-dark hidden flex-col items-center justify-center gap-8 bg-sidebar p-12 lg:flex">
        <BoardIllustration />
        <p className="max-w-sm text-center text-lg text-sidebar-ink">
          Plan it. Start it. <span className="font-bold text-white">Strike it off.</span>
        </p>
      </aside>
    </main>
  )
}
