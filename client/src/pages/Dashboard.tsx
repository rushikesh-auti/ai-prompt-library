import DashboardLayout from "../components/layout/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back 👋
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Your Prompt Library
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage, organize, and reuse your AI prompts.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Prompt cards will appear here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}