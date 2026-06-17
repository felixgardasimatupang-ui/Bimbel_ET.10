import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import Sidebar from '../components/Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    activeTab: 'ringkasan' as const,
    setActiveTab: vi.fn(),
    currentUserRole: 'SUPER_ADMIN' as const,
    offlineMode: false,
    toggleOfflineMode: vi.fn(),
    isSyncing: false,
    pendingSyncCount: 0,
    syncLogs: [] as string[],
    siswaCount: 10,
    materiCount: 5,
    quizCount: 3,
    userName: 'Admin User',
    onLogout: vi.fn(),
  };

  it('renders sidebar with app title', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('EduAdmin Bimbel')).toBeDefined();
  });

  it('shows user role', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('SUPER_ADMIN')).toBeDefined();
  });

  it('shows user name', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Admin User')).toBeDefined();
  });

  it('calls setActiveTab when nav item is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Sidebar {...defaultProps} setActiveTab={setActiveTab} />);
    fireEvent.click(screen.getByText('Siswa & QR Presensi'));
    expect(setActiveTab).toHaveBeenCalledWith('siswa');
  });

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = vi.fn();
    render(<Sidebar {...defaultProps} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('shows sync logs when provided', () => {
    const syncLogs = ['Data tersimpan lokal', 'Menunggu koneksi...'];
    render(<Sidebar {...defaultProps} syncLogs={syncLogs} />);
    expect(screen.getByText('Data tersimpan lokal')).toBeDefined();
    expect(screen.getByText('Menunggu koneksi...')).toBeDefined();
  });

  it('shows pending sync count badge', () => {
    render(<Sidebar {...defaultProps} pendingSyncCount={3} />);
    expect(screen.getByText('+3 offline changes')).toBeDefined();
  });

  it('calls toggleOfflineMode when offline toggle is clicked', () => {
    const toggleOfflineMode = vi.fn();
    render(<Sidebar {...defaultProps} toggleOfflineMode={toggleOfflineMode} />);
    fireEvent.click(screen.getByRole('button', { name: /aktifkan mode offline/i }));
    expect(toggleOfflineMode).toHaveBeenCalledOnce();
  });
});
