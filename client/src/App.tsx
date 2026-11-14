import { Toaster } from "react-hot-toast";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import { useEffect } from "react";
import { restoreSession, sessionExpired } from "./features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "./store/hooks";

function ProtectedDashboard() {
  const { user, initialized } = useAppSelector((state) => state.auth);
  const location = useLocation();
  if (!initialized)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-500 dark:bg-slate-950">
        <div role="status" className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          Restoring your session…
        </div>
      </main>
    );
  return user ? (
    <Dashboard />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(restoreSession());
    const clearSession = () => dispatch(sessionExpired());
    window.addEventListener("auth:expired", clearSession);
    return () => window.removeEventListener("auth:expired", clearSession);
  }, [dispatch]);
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedDashboard />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "dark:!bg-slate-800 dark:!text-slate-100",
        }}
      />
    </>
  );
}

export default App;
