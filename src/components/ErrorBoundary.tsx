import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-pip-bg p-8">
          <div className="max-w-md rounded-sm border border-pip-red p-6 text-center">
            <h2 className="font-display text-2xl text-pip-red text-glow mb-2">Fehler</h2>
            <p className="text-sm text-pip-greendim mb-4">
              Ein unerwarteter Fehler ist aufgetreten. Bitte lade die App neu.
            </p>
            <pre className="mb-4 max-h-40 overflow-auto rounded-sm border border-pip-line bg-black/30 p-2 text-xs text-pip-red">
              {this.state.error?.message}
            </pre>
            <button onClick={() => window.location.reload()} className="pip-btn">
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
