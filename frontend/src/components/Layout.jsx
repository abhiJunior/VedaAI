import { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, ChevronDown, Menu } from 'lucide-react';

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F0F2F5]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger – mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="hidden md:inline text-sm text-gray-400">←</span>
            <span className="text-sm font-medium text-gray-700">{title || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>
            <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:bg-gray-50 px-2 md:px-3 py-1.5 rounded-lg transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">J</span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">John Doe</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
