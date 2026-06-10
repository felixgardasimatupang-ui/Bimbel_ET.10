import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SppPanel from '../components/SppPanel';
import type { Transaksi } from '../types';

describe('SppPanel', () => {
  const mockSiswas = [
    { sppStatus: 'LUNAS' as const, sppAmount: 750000 },
    { sppStatus: 'BELUM_BAYAR' as const, sppAmount: 750000 },
    { sppStatus: 'LUNAS' as const, sppAmount: 650000 },
  ];

  const mockTx: Transaksi[] = [
    { id: 'TX-001', amount: 750000, type: 'SPP_MASUK', date: '2026-06-01', payeeName: 'Budi', status: 'LUNAS', notes: '' },
  ];

  it('renders operational cost table heading', () => {
    render(<SppPanel siswas={mockSiswas} transactions={mockTx} />);
    expect(screen.getByText('Sistem Manajemen Biaya Operasional Transparan Bagi Wali Murid')).toBeInTheDocument();
  });

  it('renders transaction list', () => {
    render(<SppPanel siswas={mockSiswas} transactions={mockTx} />);
    expect(screen.getByText('Budi')).toBeInTheDocument();
  });

  it('handles empty transactions', () => {
    render(<SppPanel siswas={mockSiswas} transactions={[]} />);
    expect(screen.getByText('Belum ada transaksi.')).toBeInTheDocument();
  });

  it('displays correct SPP totals', () => {
    const { container } = render(<SppPanel siswas={mockSiswas} transactions={mockTx} />);
    expect(container.textContent).toContain('1.400.000');
    expect(screen.getByText('Total SPP Masuk Bulan Ini:')).toBeInTheDocument();
  });

  it('handles zero siswa', () => {
    render(<SppPanel siswas={[]} transactions={[]} />);
    expect(screen.getByText('Belum ada transaksi.')).toBeInTheDocument();
  });

  it('handles zero expected SPP without division by zero', () => {
    const { container } = render(<SppPanel siswas={[{ sppStatus: 'BELUM_BAYAR' as const, sppAmount: 0 }]} transactions={[]} />);
    expect(screen.getByText('Belum ada transaksi.')).toBeInTheDocument();
  });
});
