import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SystemSettingsModal } from '../modals/SystemSettingsModal';
import { AuditLogsModal } from '../modals/AuditLogsModal';

export const AppLayout: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg flex flex-col font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
      />

      {/* Sticky Topbar */}
      <Topbar />

      {/* Main Content Area */}
      <main className="pl-[230px] pt-4 px-6 pb-6 flex-1">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Persistent Footer across all pages */}
      <footer className="pl-[230px] py-4 px-6 border-t border-slate-200 bg-white text-center text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© T-Tech Solution</span>
          <span className="text-[11px] text-slate-400 font-medium">Task Monitoring & Management SaaS Platform</span>
        </div>
      </footer>

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />
    </div>
  );
};
