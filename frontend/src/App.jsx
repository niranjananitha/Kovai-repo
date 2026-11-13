import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import Header from './components/Header'
import Loading from './components/Loading'
import LoginScreen from './components/LoginScreen'
import TaskBoard from './components/TaskBoard'

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
  // never sees the login screen flash.
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
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">
          {startupError}
        </p>
        <button type="button" onClick={retry} className="mt-4 rounded bg-indigo-700 px-4 py-2 text-white">
          Try again
        </button>
      </main>
    )
  }

  if (user === undefined) return <Loading text="Loading…" />

  if (user === null) return <LoginScreen onSignedIn={setUser} notice={notice} />

  return (
    <>
      <Header user={user} onSignOut={signOut} />
      {notice && (
        <p role="alert" className="mx-auto mt-4 max-w-2xl rounded border border-red-300 bg-red-50 p-3 text-red-900">
          {notice}
        </p>
      )}
      <TaskBoard onSessionExpired={handleSessionExpired} />
    </>
  )
}
