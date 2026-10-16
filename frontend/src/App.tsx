import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Compass, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { Logo } from "@/components/layout/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/auth/AuthPage";

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Jobs = lazy(() => import("@/pages/app/Jobs"));
const JobDetail = lazy(() => import("@/pages/app/JobDetail"));
const JobEditor = lazy(() => import("@/pages/app/JobEditor"));
const Market = lazy(() => import("@/pages/app/Market"));
const SkillGap = lazy(() => import("@/pages/app/SkillGap"));
const Profile = lazy(() => import("@/pages/app/Profile"));

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">{children}</div>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, checking, sessionError, retrySession } = useAuth();
  const location = useLocation();
  if (checking) {
    return (
      <FullScreen>
        <Logo />
        <span className="h-1 w-40 overflow-hidden rounded-full bg-line">
          <span className="block h-full w-1/3 animate-pulse rounded-full bg-signal" />
        </span>
      </FullScreen>
    );
  }
  if (!user && sessionError) {
    return (
      <FullScreen>
        <Logo />
        <div className="card w-full max-w-md">
          <ErrorState error={sessionError} onRetry={retrySession} />
        </div>
      </FullScreen>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton h-5 w-96 max-w-full" />
      <div className="skeleton mt-6 h-64 w-full rounded-2xl" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="card">
      <EmptyState
        icon={<Compass className="h-6 w-6" />}
        title="Page not found"
        description="The link may be broken, or the page may have moved."
        action={<ButtonLink to="/app">Go to dashboard</ButtonLink>}
      />
    </div>
  );
}

export default function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {[
            { index: true, el: <Dashboard /> },
            { path: "jobs", el: <Jobs /> },
            { path: "jobs/new", el: <JobEditor /> },
            { path: "jobs/:id", el: <JobDetail /> },
            { path: "jobs/:id/edit", el: <JobEditor /> },
            { path: "market", el: <Market /> },
            { path: "skill-gap", el: <SkillGap /> },
            { path: "profile", el: <Profile /> },
            { path: "*", el: <NotFound /> }
          ].map(r => (
            <Route key={r.path ?? "index"} index={r.index} path={r.path} element={<Suspense fallback={<PageFallback />}>{r.el}</Suspense>} />
          ))}
        </Route>
        <Route
          path="*"
          element={
            <FullScreen>
              <Logo />
              <p className="text-muted">That page doesn't exist.</p>
              <ButtonLink to="/">Go home</ButtonLink>
            </FullScreen>
          }
        />
      </Routes>
    </>
  );
}

/** Shown if rendering throws (a bug), so users get a way out instead of a blank page. */
export function CrashScreen({ error }: { error: Error }) {
  return (
    <FullScreen>
      <Logo />
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Something broke on this page</h1>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
        <Button className="mt-5" icon={<RefreshCw className="h-4 w-4" />} onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </FullScreen>
  );
}
