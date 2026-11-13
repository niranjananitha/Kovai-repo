export default function Header({ user, onSignOut }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
      <h1 className="text-xl font-bold">TaskFlow</h1>
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm text-slate-700" title={user.email}>
          {user.name || user.email}
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded border border-slate-400 px-3 py-1 text-sm hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
