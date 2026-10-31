/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { LimitsView } from './components/limits/LimitsView.tsx';
import { StudyPlannerView } from './components/planner/StudyPlannerView.tsx';
import { GoalsView } from './components/goals/GoalsView.tsx';
import { NightlyReportView } from './components/nightly/NightlyReportView.tsx';
import { CsvUploadView } from './components/csv/CsvUploadView.tsx';
import { AIAssistantView } from './components/assistant/AIAssistantView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { WhatsAppModal } from './components/whatsapp/WhatsAppModal.tsx';
import { PomodoroModal } from './components/common/PomodoroModal.tsx';

function MainLayout() {
  const { activeTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'limits':
        return <LimitsView />;
      case 'planner':
        return <StudyPlannerView />;
      case 'goals':
        return <GoalsView />;
      case 'nightly':
        return <NightlyReportView />;
      case 'csv':
        return <CsvUploadView />;
      case 'assistant':
        return <AIAssistantView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        <Header onOpenMobile={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <WhatsAppModal />
      <PomodoroModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
