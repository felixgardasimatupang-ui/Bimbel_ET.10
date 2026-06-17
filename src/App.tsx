import { lazy, Suspense, memo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsStrip from './components/StatsStrip';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import { SiswaPanelProvider } from './contexts/SiswaPanelContext';

const RingkasanPanel = lazy(() => import('./components/RingkasanPanel'));
const SiswaPanel = lazy(() => import('./components/SiswaPanel'));
const PengajarPanel = lazy(() => import('./components/PengajarPanel'));
const SppPanel = lazy(() => import('./components/SppPanel'));
const ModulPanel = lazy(() => import('./components/ModulPanel'));
const HakAksesPanel = lazy(() => import('./components/HakAksesPanel'));
const AuditLogPanel = lazy(() => import('./components/AuditLogPanel'));

const MemoizedRingkasanPanel = memo(RingkasanPanel);
const MemoizedPengajarPanel = memo(PengajarPanel);
const MemoizedSppPanel = memo(SppPanel);

function SidebarSection() {
  const {
    activeTab, setActiveTab,
    offlineMode, toggleOfflineMode,
    isSyncing, pendingSyncCount, syncLogs,
    siswas, materis, quizzes,
  } = useData();
  const { user: authUser, logout } = useAuth();

  return (
    <Sidebar
      activeTab={activeTab} setActiveTab={setActiveTab}
      currentUserRole={authUser!.role}
      offlineMode={offlineMode} toggleOfflineMode={toggleOfflineMode}
      isSyncing={isSyncing} pendingSyncCount={pendingSyncCount} syncLogs={syncLogs}
      siswaCount={siswas.length} materiCount={materis.length} quizCount={quizzes.length}
      userName={authUser?.name || ''} onLogout={logout}
    />
  );
}

function HeaderSection() {
  const {
    offlineMode, pendingSyncCount,
    handleSyncData, triggerAutomatedSPPNotification, triggerExamReminderNotification, exportToCSV,
  } = useData();

  return (
    <Header
      offlineMode={offlineMode} pendingSyncCount={pendingSyncCount}
      onSync={handleSyncData} onSPPReminder={triggerAutomatedSPPNotification}
      onExamReminder={triggerExamReminderNotification} onExportCSV={exportToCSV}
    />
  );
}

function StatsSection() {
  const { siswas, teachers, totalSPPCollected, percentSPPCollected } = useData();
  return (
    <StatsStrip
      siswas={siswas} teachers={teachers}
      totalSPPCollected={totalSPPCollected} percentSPPCollected={percentSPPCollected}
    />
  );
}

function RingkasanSection() {
  const {
    siswas, notifs, selectedSiswaId, setSelectedSiswaId,
    performanceTrendData, simulateCheckinSiswa, toggleSppPaymentStatus,
  } = useData();
  const { user } = useAuth();

  return (
    <ErrorBoundary key="ringkasan">
      <MemoizedRingkasanPanel
        siswas={siswas} notifs={notifs} selectedSiswaId={selectedSiswaId}
        setSelectedSiswaId={setSelectedSiswaId} performanceTrendData={performanceTrendData}
        onSimulateCheckin={simulateCheckinSiswa} onToggleSpp={toggleSppPaymentStatus}
        currentUserRole={user!.role}
      />
    </ErrorBoundary>
  );
}

function SiswaSection() {
  const {
    filteredSiswas, selectedSiswaId, setSelectedSiswaId,
    studentSearch, setStudentSearch, studentClassFilter, setStudentClassFilter,
    newSiswaOpen, setNewSiswaOpen, formDataSiswa, setFormDataSiswa,
    handleAddSiswa, qrSession, handleRegenerateQr,
    gpsLoading, gpsLocation, queryBrowserGeolocation,
    simulateCheckinSiswa, toggleSppPaymentStatus,
  } = useData();
  const { user } = useAuth();

  return (
    <ErrorBoundary key="siswa">
      <SiswaPanelProvider value={{
        filteredSiswas, selectedSiswaId, setSelectedSiswaId,
        studentSearch, setStudentSearch,
        studentClassFilter, setStudentClassFilter,
        newSiswaOpen, setNewSiswaOpen,
        formDataSiswa, setFormDataSiswa,
        onAddSiswa: handleAddSiswa,
        qrSession, onRegenerateQr: handleRegenerateQr,
        gpsLoading, gpsLocation, onGpsQuery: queryBrowserGeolocation,
        onSimulateCheckin: simulateCheckinSiswa,
        onToggleSpp: toggleSppPaymentStatus,
        currentUserRole: user!.role,
      }}>
        <SiswaPanel />
      </SiswaPanelProvider>
    </ErrorBoundary>
  );
}

function PengajarSection() {
  const {
    teachers, schedules, evalTeacherId, setEvalTeacherId,
    pedagogicalScore, setPedagogicalScore,
    professionalScore, setProfessionalScore,
    socialScore, setSocialScore,
    evalFeedback, setEvalFeedback,
    handleSubmitTeacherEvaluation,
  } = useData();

  return (
    <ErrorBoundary key="pengajar">
      <MemoizedPengajarPanel
        teachers={teachers} schedules={schedules} evalTeacherId={evalTeacherId} setEvalTeacherId={setEvalTeacherId}
        pedagogicalScore={pedagogicalScore} setPedagogicalScore={setPedagogicalScore}
        professionalScore={professionalScore} setProfessionalScore={setProfessionalScore}
        socialScore={socialScore} setSocialScore={setSocialScore}
        evalFeedback={evalFeedback} setEvalFeedback={setEvalFeedback}
        onSubmitEvaluation={handleSubmitTeacherEvaluation}
      />
    </ErrorBoundary>
  );
}

function SppSection() {
  const { transactions, totalSPPCollected } = useData();
  return (
    <ErrorBoundary key="spp">
      <MemoizedSppPanel transactions={transactions} totalSPPCollected={totalSPPCollected} />
    </ErrorBoundary>
  );
}

function ModulSection() {
  const {
    filteredMateris, materiSearch, setMateriSearch,
    materiSubjectFilter, setMateriSubjectFilter,
    newMateriOpen, setNewMateriOpen, formDataMateri, setFormDataMateri,
    handleAddMateri, handleDownloadMateri,
    quizzes, activeQuizPlay, quizAnswers, quizResult,
    handleStartQuiz, handleSelectQuizAnswer, handleSubmitQuiz, handleCloseQuiz,
    activeStudentName,
  } = useData();
  const { user } = useAuth();

  return (
    <ErrorBoundary key="modul">
      <ModulPanel
        filteredMateris={filteredMateris} materiSearch={materiSearch}
        setMateriSearch={setMateriSearch} materiSubjectFilter={materiSubjectFilter}
        setMateriSubjectFilter={setMateriSubjectFilter}
        newMateriOpen={newMateriOpen} setNewMateriOpen={setNewMateriOpen}
        formDataMateri={formDataMateri} setFormDataMateri={setFormDataMateri}
        onAddMateri={handleAddMateri} onDownload={handleDownloadMateri}
        quizzes={quizzes} activeQuizPlay={activeQuizPlay}
        quizAnswers={quizAnswers} quizResult={quizResult}
        onStartQuiz={handleStartQuiz} onSelectAnswer={handleSelectQuizAnswer}
        onSubmitQuiz={handleSubmitQuiz} onCloseQuiz={handleCloseQuiz}
        currentUserRole={user!.role}
        activeStudentName={activeStudentName}
      />
    </ErrorBoundary>
  );
}

function DashboardShell() {
  const { activeTab, toast, offlineMode } = useData();

  return (
    <ErrorBoundary>
      <div id="edu_admin_root" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} />}

        <SidebarSection />

        <main id="main_container" className="flex-1 flex flex-col overflow-hidden">
          <HeaderSection />

          <div id="workspace_viewport" className="p-4 space-y-4 flex-1 overflow-y-auto flex flex-col bg-slate-50/50">
            <StatsSection />

            <Suspense fallback={<div className="flex-1 animate-pulse space-y-3 p-4">
              <div className="h-8 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-24 bg-slate-200 rounded" />
                <div className="h-24 bg-slate-200 rounded" />
                <div className="h-24 bg-slate-200 rounded" />
              </div>
              <div className="h-64 bg-slate-200 rounded" />
            </div>}>
              {activeTab === 'ringkasan' && <RingkasanSection />}
              {activeTab === 'siswa' && <SiswaSection />}
              {activeTab === 'pengajar' && <PengajarSection />}
              {activeTab === 'spp' && <SppSection />}
              {activeTab === 'modul' && <ModulSection />}
              {activeTab === 'hak_akses' && (
                <ErrorBoundary key="hak_akses">
                  <HakAksesPanel />
                </ErrorBoundary>
              )}
              {activeTab === 'audit' && (
                <ErrorBoundary key="audit">
                  <AuditLogPanel />
                </ErrorBoundary>
              )}
            </Suspense>
          </div>

          <footer id="footer_bar" className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between shrink-0 text-[10px] text-slate-500 font-mono">
            <div>
              STATUS INFRA: <span className="text-emerald-500 font-bold">● OPERATING OPTIMAL</span>
              {' | '}LOKASI: INDONESIA_HQ_GPS_CENTRIC
              {' | '}OFFLINE: <span className={offlineMode ? 'text-amber-500 font-bold' : 'text-slate-500'}>{offlineMode ? 'STANDBY_QUEUE' : 'OFF'}</span>
            </div>
            <div className="hidden sm:inline">© 2026 EDUADMIN BIMBEL • MANAJEMEN TRANSPARAN OPERASIONAL SELESAI</div>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm">Memuat...</div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <DashboardShell />
    </DataProvider>
  );
}
