import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-anime-bg text-white flex flex-col items-center justify-center p-4">
          <div className="bg-anime-surface-muted border border-anime-primary/50 shadow-[0_0_30px_rgba(244,63,94,0.15)] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-anime-cta/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-anime-cta w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold mb-4 font-['Russo_One'] tracking-wide text-anime-primary">
              System Malfunction
            </h1>

            <p className="text-gray-400 mb-6 text-sm">
              An unexpected critical error occurred in the neural interface.
              Our cyber-techs have been notified.
            </p>

            <div className="bg-anime-bg p-4 rounded-lg text-left text-xs font-mono text-gray-500 overflow-x-auto mb-8">
              {this.state.error?.message || 'Unknown Error Signature'}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-anime-primary hover:bg-anime-secondary text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_20px_rgba(124,58,237,0.6)]"
            >
              Reboot Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
