import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsStrip from '../components/StatsStrip';
import type { Siswa, Teacher } from '../types';

const mockSiswas: Siswa[] = [
  { id: '1', name: 'A', classLevel: '10 SMA', performanceScore: 80, attendanceRate: 90, email: 'a@test.com', parentName: 'PA', parentEmail: '', sppStatus: 'LUNAS', sppAmount: 750000, progressHistory: [], subjectsScore: [], qrCodeData: '', locationCheckedIn: true },
  { id: '2', name: 'B', classLevel: '11 SMA', performanceScore: 70, attendanceRate: 80, email: 'b@test.com', parentName: 'PB', parentEmail: '', sppStatus: 'BELUM_BAYAR', sppAmount: 750000, progressHistory: [], subjectsScore: [], qrCodeData: '', locationCheckedIn: false },
];

const mockTeachers: Teacher[] = [
  { id: 'T1', name: 'Guru 1', subjects: ['Math'], rating: 4.5, attendanceRate: 95, evaluationScore: 90, totalClasses: 10, activeStudents: 20, evaluations: [] },
];

describe('StatsStrip', () => {
  it('displays correct student count', async () => {
    render(<StatsStrip siswas={mockSiswas} teachers={mockTeachers} totalSPPCollected={750000} percentSPPCollected={50} />);
    expect(await screen.findByText('2', {}, { timeout: 1500 })).toBeInTheDocument();
  });

  it('displays SPP collected', () => {
    render(<StatsStrip siswas={mockSiswas} teachers={mockTeachers} totalSPPCollected={750000} percentSPPCollected={50} />);
    expect(screen.getByText((content) => content.includes('750000'))).toBeInTheDocument();
  });

  it('handles empty students', () => {
    render(<StatsStrip siswas={[]} teachers={mockTeachers} totalSPPCollected={0} percentSPPCollected={0} />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});
