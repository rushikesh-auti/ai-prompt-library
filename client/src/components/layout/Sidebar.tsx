import {
  FiArchive,
  FiHeart,
  FiHome,
  FiPlus,
  FiStar,
  FiTag,
} from "react-icons/fi";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onAddPrompt: () => void;
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
}: SidebarProps) {
  const menuItems = [
    {
      id: "all",
      label: "All Prompts",
      icon: FiHome,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: FiHeart,
    },
    {
      id: "pinned",
      label: "Pinned",
      icon: FiStar,
    },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FiArchive size={20} />
          </div>

          <div>
            <h1 className="text-sm font-bold text-slate-900">
              AI Prompt
            </h1>

            <p className="text-xs text-slate-500">
              Library
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Library
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
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center gap-2 px-3">
            <FiTag size={14} className="text-slate-400" />

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onAddPrompt}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FiPlus size={18} />
          Add Prompt
        </button>
      </div>
    </aside>
  );
}