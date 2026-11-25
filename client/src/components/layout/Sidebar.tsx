import {
  FiArchive,
  FiCompass,
  FiFolder,
  FiHeart,
  FiHome,
  FiPlus,
  FiSettings,
  FiTag,
  FiTrash2,
} from "react-icons/fi";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onAddPrompt: () => void;
  mobile?: boolean;
}

const categories = [
  "Coding",
  "Marketing",
  "Content Writing",
  "Email",
  "Resume",
  "SQL",
  "Design",
  "Social Media",
  "Productivity",
  "Others",
];

export default function Sidebar({
  activeView,
  onViewChange,
  onAddPrompt,
  mobile = false,
}: SidebarProps) {
  const menuItems = [
    {
      id: "all",
      label: "My prompts",
      icon: FiHome,
    },
    {
      id: "explore",
      label: "Explore",
      icon: FiCompass,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: FiHeart,
    },
    {
      id: "collections",
      label: "Collections",
      icon: FiFolder,
    },
    {
      id: "folders",
      label: "Folders",
      icon: FiFolder,
    },
    {
      id: "trash",
      label: "Trash",
      icon: FiTrash2,
    },
    {
      id: "settings",
      label: "Settings",
      icon: FiSettings,
    },
  ];

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col bg-white dark:bg-slate-900"
          : "hidden h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex"
      }
    >
      {/* Logo */}
      <div className="shrink-0 border-b border-slate-200 p-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-none">
            <FiArchive size={19} />
          </div>

          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              Promptwise
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Library */}
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="mt-8">
          <div className="mb-2 flex items-center gap-2 px-3">
            <FiTag size={14} className="text-slate-400" />

            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Categories
            </p>
          </div>

          <div className="space-y-1">
            {categories.map((category) => {
              const isActive = activeView === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onViewChange(category)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-violet-50 font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Add Prompt */}
      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onAddPrompt}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        >
          <FiPlus size={18} />
          Add Prompt
        </button>
      </div>
    </aside>
  );
}
