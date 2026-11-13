import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import AppShell from './components/AppShell'
import AuthScreen from './components/AuthScreen'
import Loading from './components/Loading'

export default function App() {
  // user: undefined = still asking the server, null = signed out, object = signed in
  const [user, setUser] = useState(undefined)
  const [notice, setNotice] = useState('')
  const [startupError, setStartupError] = useState('')

  function checkSession() {
    api('/auth/me')
      .then(setUser)
      .catch((err) => {
        if (err.status === 401) setUser(null)
        else setStartupError(err.message)
      })
  }

  // Ask the server who we are before drawing anything, so a signed-in user
  // never sees the sign-in screen flash.
  useEffect(checkSession, [])

  function retry() {
    setStartupError('')
    checkSession()
  }

  const handleSessionExpired = useCallback(() => {
    setNotice('Your session has expired. Please sign in again.')
    setUser(null)
  }, [])

  async function signOut() {
    try {
      await api('/auth/logout', { method: 'POST' })
      setNotice('')
      setUser(null)
    } catch (err) {
      setNotice(`Could not sign out. ${err.message}`)
    }
  }

  if (startupError) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-4 font-medium text-danger">
          {startupError}
        </p>
        <button type="button" onClick={retry} className="btn btn-primary mt-4">
          Try again
        </button>
      </main>
    )
  }

  if (user === undefined) return <Loading fullScreen text="Loading…" />

  if (user === null) return <AuthScreen onSignedIn={setUser} notice={notice} />

  return <AppShell user={user} onSignOut={signOut} onSessionExpired={handleSessionExpired} />
}
