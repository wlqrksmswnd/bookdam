import BackButton from '../components/BackButton.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function AuthForm({ title, error, onSubmit, submitLabel, submitting, footer, showBack, children }) {
  return (
    <div className="mx-auto max-w-sm py-10">
      {showBack && <BackButton className="mb-2" />}
      <h1 className="mb-6 text-center font-serif text-3xl font-bold">{title}</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
        {children}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={submitting}
          className="w-full rounded-lg bg-ink py-2.5 text-paper hover:bg-stone-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-500">{footer}</p>
    </div>
  )
}

export function Field({ label, hint, ...props }) {
  const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none'

  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-stone-400">{hint}</span>}
      <div className="mt-1">
        {props.type === 'password' ? (
          <PasswordInput required {...props} className={inputClass} />
        ) : (
          <input required {...props} className={inputClass} />
        )}
      </div>
    </label>
  )
}
