import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from '../components/Toast';

describe('Toast', () => {
  it('renders success message', () => {
    render(<Toast message="Berhasil!" type="success" />);
    expect(screen.getByText('Berhasil!')).toBeInTheDocument();
  });

  it('renders warning message', () => {
    render(<Toast message="Perhatian!" type="warn" />);
    expect(screen.getByText('Perhatian!')).toBeInTheDocument();
  });

  it('renders info message', () => {
    render(<Toast message="Informasi" type="info" />);
    expect(screen.getByText('Informasi')).toBeInTheDocument();
  });

  it('has correct background for success type', () => {
    const { container } = render(<Toast message="Test" type="success" />);
    expect(container.firstChild).toHaveClass('bg-emerald-500');
  });

  it('has correct background for warning type', () => {
    const { container } = render(<Toast message="Test" type="warn" />);
    expect(container.firstChild).toHaveClass('bg-amber-500');
  });
});
