import { Outlet } from 'react-router-dom';
import { TopicsSidebar } from './TopicsSidebar';
import { BarChart3 } from 'lucide-react';
import React from 'react';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="flex items-center gap-2 p-4 border-b">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-lg">Financial Analytics</h1>
        </div>
        <TopicsSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
