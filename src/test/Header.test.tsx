import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import Header from '../components/Header';

describe('Header', () => {
  const defaultProps = {
    offlineMode: false,
    pendingSyncCount: 0,
    onSync: vi.fn(),
    onSPPReminder: vi.fn(),
    onExamReminder: vi.fn(),
    onExportCSV: vi.fn(),
  };

  it('renders sync status as online', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Real-time Cloud Sync Active/i)).toBeDefined();
  });

  it('renders offline status when offlineMode is true', () => {
    render(<Header {...defaultProps} offlineMode />);
    expect(screen.getByText(/Offline Standby/i)).toBeDefined();
  });

  it('shows sync button when pendingSyncCount > 0', () => {
    render(<Header {...defaultProps} pendingSyncCount={3} />);
    expect(screen.getByText(/Sinkronisasi Sekarang \(3\)/i)).toBeDefined();
  });

  it('calls onSync when sync button is clicked', () => {
    const onSync = vi.fn();
    render(<Header {...defaultProps} pendingSyncCount={2} onSync={onSync} />);
    fireEvent.click(screen.getByRole('button', { name: /sinkronisasi/i }));
    expect(onSync).toHaveBeenCalledOnce();
  });

  it('calls onSPPReminder when SPP reminder button is clicked', () => {
    const onSPPReminder = vi.fn();
    render(<Header {...defaultProps} onSPPReminder={onSPPReminder} />);
    fireEvent.click(screen.getByRole('button', { name: /picu pengingat spp/i }));
    expect(onSPPReminder).toHaveBeenCalledOnce();
  });

  it('calls onExamReminder when exam reminder button is clicked', () => {
    const onExamReminder = vi.fn();
    render(<Header {...defaultProps} onExamReminder={onExamReminder} />);
    fireEvent.click(screen.getByRole('button', { name: /pengingat ujian/i }));
    expect(onExamReminder).toHaveBeenCalledOnce();
  });

  it('calls onExportCSV when export button is clicked', () => {
    const onExportCSV = vi.fn();
    render(<Header {...defaultProps} onExportCSV={onExportCSV} />);
    fireEvent.click(screen.getByRole('button', { name: /ekspor csv/i }));
    expect(onExportCSV).toHaveBeenCalledOnce();
  });

  it('does not render sync button when pendingSyncCount is 0', () => {
    render(<Header {...defaultProps} />);
    expect(screen.queryByText(/Sinkronisasi Sekarang/i)).toBeNull();
  });
});
