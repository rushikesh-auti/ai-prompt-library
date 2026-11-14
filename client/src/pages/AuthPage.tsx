import { useState, type FormEvent } from "react";
import { FiArchive, FiArrowRight, FiEye, FiEyeOff, FiLock, FiStar } from "react-icons/fi";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginUser, registerUser, clearAuthError } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, initialized, error } = useAppSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState("");
  const isLogin = mode === "login";

  if (initialized && user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError("");
    dispatch(clearAuthError());
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setValidationError("Enter your password.");
      return;
    }
    if (!isLogin && name.trim().length < 2) {
      setValidationError("Your name must be at least 2 characters.");
      return;
    }
    if (!isLogin && password.length < 12) {
      setValidationError("Use at least 12 characters for your password.");
      return;
    }

    try {
      await dispatch(
        isLogin
          ? loginUser({ email: email.trim(), password })
          : registerUser({ name: name.trim(), email: email.trim(), password }),
      ).unwrap();
      const destination = (location.state as { from?: string } | null)?.from || "/";
      navigate(destination, { replace: true });
    } catch {
      // The API error is displayed inline from the authentication state.
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(380px,.92fr)_1.08fr]">
        <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col xl:px-16">
          <div className="absolute -left-36 top-36 h-96 w-96 rounded-full border border-violet-300/10" />
          <div className="absolute -left-20 top-52 h-64 w-64 rounded-full border border-violet-300/15" />
          <div className="absolute bottom-[-190px] right-[-130px] h-[470px] w-[470px] rounded-full bg-violet-600/20 blur-3xl" />
          <Link to="/login" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40"><FiArchive size={20} /></span>
            <span><span className="block text-sm font-bold tracking-wide">Promptwise</span><span className="block text-xs text-slate-400">AI prompt workspace</span></span>
          </Link>
          <div className="relative z-10 my-auto max-w-xl py-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-200"><FiStar size={14} /> A calmer way to work with AI</div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Good prompts deserve a place of their own.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Save what works, organize your workflows, and find your next great starting point in one focused library.</p>
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-400"><span className="h-px w-9 bg-violet-400" /> Your ideas, ready when you are</div>
          </div>
          <p className="relative z-10 text-xs text-slate-500">A private home for your best AI workflows.</p>
        </aside>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-24">
          <div className="mx-auto flex w-full max-w-md items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white"><FiArchive size={19} /></span>
            <span><span className="block text-sm font-bold">Promptwise</span><span className="block text-xs text-slate-500">AI prompt workspace</span></span>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold text-violet-700 dark:text-violet-300">{isLogin ? "Welcome back" : "Get started for free"}</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{isLogin ? "Sign in to your library" : "Create your account"}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{isLogin ? "Pick up right where your best ideas left off." : "A more organized home for the prompts you rely on."}</p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              {!isLogin && (
                <div>
                  <label htmlFor="auth-name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Your name</label>
                  <input id="auth-name" type="text" value={name} onChange={(event) => { setName(event.target.value); setValidationError(""); dispatch(clearAuthError()); }} autoComplete="name" required minLength={2} maxLength={80} aria-invalid={validationError === "Your name must be at least 2 characters."} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950" placeholder="How should we address you?" />
                </div>
              )}
              <div>
                <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email address</label>
                <input id="auth-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setValidationError(""); dispatch(clearAuthError()); }} autoComplete="email" required maxLength={254} aria-invalid={validationError === "Enter a valid email address."} aria-describedby={error || validationError ? "auth-error" : undefined} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950" placeholder="you@company.com" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                  {!isLogin && <span className="text-xs text-slate-400">12 characters minimum</span>}
                </div>
                <div className="relative">
                  <FiLock aria-hidden="true" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="auth-password" type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setValidationError(""); dispatch(clearAuthError()); }} autoComplete={isLogin ? "current-password" : "new-password"} required minLength={isLogin ? 1 : 12} maxLength={128} aria-invalid={Boolean(validationError && (!password || !isLogin && password.length < 12))} aria-describedby={error || validationError ? "auth-error" : undefined} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-950" placeholder={isLogin ? "Enter your password" : "Choose a strong password"} />
                  <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-violet-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                    {passwordVisible ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              {(error || validationError) && (
                <div id="auth-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error || validationError}</div>
              )}

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none">
                {loading ? (isLogin ? "Signing you in..." : "Creating your account...") : (isLogin ? "Sign in" : "Create account")}
                {!loading && <FiArrowRight size={16} />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? "New to Promptwise? " : "Already have an account? "}
              <Link className="font-semibold text-violet-700 hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-violet-600 dark:text-violet-300" to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link>
            </p>
          </div>
          <p className="mx-auto w-full max-w-md text-center text-xs text-slate-400">Your prompts are private to your account unless you choose to share them.</p>
        </section>
      </div>
    </main>
  );
}
