import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SppPanel from '../components/SppPanel';
import type { Transaksi } from '../types';

describe('SppPanel', () => {
  const mockTx: Transaksi[] = [
    { id: 'TX-001', amount: 750000, type: 'SPP_MASUK', date: '2026-06-01', payeeName: 'Budi', status: 'LUNAS', notes: '' },
  ];

  it('renders operational cost table heading', () => {
    render(<SppPanel transactions={mockTx} totalSPPCollected={750000} />);
    expect(screen.getByText('Sistem Manajemen Biaya Operasional Transparan Bagi Wali Murid')).toBeInTheDocument();
  });

  it('renders transaction list', () => {
    render(<SppPanel transactions={mockTx} totalSPPCollected={750000} />);
    expect(screen.getByText('Budi')).toBeInTheDocument();
  });

  it('handles empty transactions', () => {
    render(<SppPanel transactions={[]} totalSPPCollected={0} />);
    expect(screen.getByText('Belum ada transaksi.')).toBeInTheDocument();
  });

  it('displays correct SPP totals', () => {
    const { container } = render(<SppPanel transactions={mockTx} totalSPPCollected={750000} />);
    expect(container.textContent).toContain('750.000');
    expect(screen.getByText('Total SPP Masuk Bulan Ini:')).toBeInTheDocument();
  });

  it('handles zero transactions', () => {
    render(<SppPanel transactions={[]} totalSPPCollected={0} />);
    expect(screen.getByText('Belum ada transaksi.')).toBeInTheDocument();
  });
});
