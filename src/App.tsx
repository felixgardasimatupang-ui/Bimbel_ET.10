import { lazy, Suspense } from 'react';
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

function DashboardShell() {
  const {
    siswas, teachers, notifs, transactions, materis, quizzes, schedules, filteredSiswas, filteredMateris,
    selectedSiswaId, setSelectedSiswaId,
    studentSearch, setStudentSearch, studentClassFilter, setStudentClassFilter,
    materiSearch, setMateriSearch, materiSubjectFilter, setMateriSubjectFilter,
    newSiswaOpen, setNewSiswaOpen, formDataSiswa, setFormDataSiswa,
    newMateriOpen, setNewMateriOpen, formDataMateri, setFormDataMateri,
    activeQuizPlay, quizAnswers, quizResult,
    qrSession, gpsLoading, gpsLocation,
    evalTeacherId, setEvalTeacherId,
    pedagogicalScore, setPedagogicalScore,
    professionalScore, setProfessionalScore,
    socialScore, setSocialScore,
    evalFeedback, setEvalFeedback,
    totalSPPCollected, percentSPPCollected, performanceTrendData, activeStudentName,
    activeTab, setActiveTab,
    handleAddSiswa, handleAddMateri,
    handleStartQuiz, handleSelectQuizAnswer, handleSubmitQuiz, handleCloseQuiz,
    toggleSppPaymentStatus, simulateCheckinSiswa, queryBrowserGeolocation,
    handleRegenerateQr, handleSubmitTeacherEvaluation, exportToCSV,
    triggerAutomatedSPPNotification, triggerExamReminderNotification, handleDownloadMateri,
    toast, offlineMode, pendingSyncCount, isSyncing, syncLogs, handleSyncData, toggleOfflineMode,
  } = useData();

  const { user: authUser, logout } = useAuth();
  const currentUserRole = authUser!.role;

  return (
    <ErrorBoundary>
      <div id="edu_admin_root" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {toast && <Toast message={toast.message} type={toast.type} />}

        <Sidebar
          activeTab={activeTab} setActiveTab={setActiveTab}
          currentUserRole={currentUserRole}
          offlineMode={offlineMode} toggleOfflineMode={toggleOfflineMode}
          isSyncing={isSyncing} pendingSyncCount={pendingSyncCount} syncLogs={syncLogs}
          siswaCount={siswas.length} materiCount={materis.length} quizCount={quizzes.length}
          userName={authUser?.name || ''} onLogout={logout}
        />

        <main id="main_container" className="flex-1 flex flex-col overflow-hidden">
          <Header
            offlineMode={offlineMode} pendingSyncCount={pendingSyncCount}
            onSync={handleSyncData} onSPPReminder={triggerAutomatedSPPNotification}
            onExamReminder={triggerExamReminderNotification} onExportCSV={exportToCSV}
          />

          <div id="workspace_viewport" className="p-4 space-y-4 flex-1 overflow-y-auto flex flex-col bg-slate-50/50">
            <StatsStrip
              siswas={siswas} teachers={teachers}
              totalSPPCollected={totalSPPCollected} percentSPPCollected={percentSPPCollected}
            />

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
              <ErrorBoundary key="ringkasan">
                {activeTab === 'ringkasan' && (
                  <RingkasanPanel
                    siswas={siswas} notifs={notifs} selectedSiswaId={selectedSiswaId}
                    setSelectedSiswaId={setSelectedSiswaId} performanceTrendData={performanceTrendData}
                    onSimulateCheckin={simulateCheckinSiswa} onToggleSpp={toggleSppPaymentStatus}
                    currentUserRole={currentUserRole}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="siswa">
                {activeTab === 'siswa' && (
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
                    currentUserRole,
                  }}>
                    <SiswaPanel />
                  </SiswaPanelProvider>
                )}
              </ErrorBoundary>

              <ErrorBoundary key="pengajar">
                {activeTab === 'pengajar' && (
                  <PengajarPanel
                    teachers={teachers} schedules={schedules} evalTeacherId={evalTeacherId} setEvalTeacherId={setEvalTeacherId}
                    pedagogicalScore={pedagogicalScore} setPedagogicalScore={setPedagogicalScore}
                    professionalScore={professionalScore} setProfessionalScore={setProfessionalScore}
                    socialScore={socialScore} setSocialScore={setSocialScore}
                    evalFeedback={evalFeedback} setEvalFeedback={setEvalFeedback}
                    onSubmitEvaluation={handleSubmitTeacherEvaluation}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="spp">
                {activeTab === 'spp' && (
                  <SppPanel transactions={transactions} totalSPPCollected={totalSPPCollected} />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="modul">
                {activeTab === 'modul' && (
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
                    currentUserRole={currentUserRole}
                    activeStudentName={activeStudentName}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary key="hak_akses">
                {activeTab === 'hak_akses' && <HakAksesPanel />}
              </ErrorBoundary>
              <ErrorBoundary key="audit">
                {activeTab === 'audit' && <AuditLogPanel />}
              </ErrorBoundary>
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
