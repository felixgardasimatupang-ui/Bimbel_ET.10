import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

const GoodComponent = () => <div>Selamat datang</div>;
const BadComponent = () => { throw new Error('Test error'); };

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodComponent /></ErrorBoundary>);
    expect(screen.getByText('Selamat datang')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary key="test1"><BadComponent /></ErrorBoundary>);
    expect(screen.getByText('Terjadi Kesalahan Tidak Terduga')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Coba Lagi')).toBeInTheDocument();
    expect(screen.getByText('Reset Semua Data')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('retry button clears error state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<ErrorBoundary key="test2"><BadComponent /></ErrorBoundary>);
    expect(screen.getByText('Terjadi Kesalahan Tidak Terduga')).toBeInTheDocument();
    rerender(<ErrorBoundary key="test2"><GoodComponent /></ErrorBoundary>);
    fireEvent.click(screen.getByText('Coba Lagi'));
    expect(screen.getByText('Selamat datang')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
