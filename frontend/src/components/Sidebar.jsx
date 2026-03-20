import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wand2,
  Library,
  Settings,
  Plus,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/groups', label: 'My Groups', icon: Users },
  { to: '/assignments', label: 'Assignments', icon: FileText },
  { to: '/toolkit', label: "AI Teacher's Toolkit", icon: Wand2 },
  { to: '/library', label: 'My Library', icon: Library },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleNavAndClose = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-60 bg-white border-r border-gray-100 flex flex-col shadow-sm
          transform transition-transform duration-300 ease-in-out
          md:sticky md:translate-x-0 md:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">VedaAI</span>
          </div>
          {/* Close button – mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Create Btn */}
        <div className="px-4 py-4">
          <button
            onClick={() => handleNavAndClose('/assignments/create')}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <Plus size={16} />
            Create Assignment
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => { if (onClose) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
          <NavLink
            to="/settings"
            onClick={() => { if (onClose) onClose(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Settings size={17} />
            Settings
          </NavLink>

          {/* School profile */}
          <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">DPS</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">Delhi Public School</p>
              <p className="text-[10px] text-gray-500 truncate">Bokaro Steel City</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
