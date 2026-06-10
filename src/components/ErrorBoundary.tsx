import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="bg-white p-8 rounded-lg border border-red-200 shadow-sm max-w-md text-center">
            <div className="text-red-500 text-4xl mb-4">⚠</div>
            <h2 className="text-sm font-bold text-slate-800 mb-2">Terjadi Kesalahan Tidak Terduga</h2>
            <p className="text-xs text-slate-500 mb-4">
              Aplikasi mengalami error. Silakan refresh halaman atau hubungi administrator.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700"
              >
                Reset Semua Data
              </button>
            </div>
            {this.state.error && (
              <pre className="mt-4 text-[10px] text-left bg-slate-100 p-2 rounded overflow-auto max-h-40 text-red-600">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
