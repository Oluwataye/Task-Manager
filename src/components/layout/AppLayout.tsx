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
      <main className="pl-[230px] pt-4 px-6 pb-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

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
