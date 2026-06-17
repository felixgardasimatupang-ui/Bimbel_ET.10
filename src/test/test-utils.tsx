import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

function MockAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function MockDataProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

type WrapperOptions = {
  withAuth?: boolean;
  withData?: boolean;
};

export function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions & WrapperOptions = {},
) {
  const { withAuth, withData, ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    let content = children;
    if (withData) content = <MockDataProvider>{content}</MockDataProvider>;
    if (withAuth) content = <MockAuthProvider>{content}</MockAuthProvider>;
    return content;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export function createMockFetch(responseData: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(responseData), { status }),
  );
}

export function createMockFetchSequential(responses: Array<{ data: unknown; status?: number }>) {
  const queue = [...responses];
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const next = queue.shift();
    if (!next) {
      return new Response(JSON.stringify({ success: false, error: 'unexpected' }), { status: 404 });
    }
    return new Response(JSON.stringify(next.data), { status: next.status ?? 200 });
  });
}

export function mockImportMeta(overrides: Record<string, string> = {}) {
  vi.stubGlobal('import.meta', {
    env: {
      VITE_API_URL: 'http://localhost:3001/api',
      ...overrides,
    },
  });
}

export { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
