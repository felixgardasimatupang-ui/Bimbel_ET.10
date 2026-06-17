import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import AvatarWithFallback from '../components/AvatarWithFallback';

describe('AvatarWithFallback', () => {
  it('renders image when src is provided', () => {
    render(<AvatarWithFallback src="/photo.jpg" alt="Foto Budi" />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('/photo.jpg');
  });

  it('renders initials when no src', () => {
    render(<AvatarWithFallback src={undefined} alt="Foto Budi Santoso" />);
    expect(screen.getByText('BS')).toBeDefined();
  });

  it('renders single initial for single word name', () => {
    render(<AvatarWithFallback src={undefined} alt="Foto Admin" />);
    expect(screen.getByText('A')).toBeDefined();
  });

  it('renders initials when image fails to load', async () => {
    render(<AvatarWithFallback src="/invalid.jpg" alt="Foto Siti" />);
    const img = screen.getByRole('img');
    img.dispatchEvent(new Event('error'));
    await expect(screen.findByText('S')).resolves.toBeDefined();
  });
});
