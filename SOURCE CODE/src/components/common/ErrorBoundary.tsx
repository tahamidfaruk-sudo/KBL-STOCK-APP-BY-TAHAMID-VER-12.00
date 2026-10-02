import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
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
        <div className="p-6 my-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-center">
          <div className="inline-flex p-3 bg-red-100 dark:bg-red-900/50 rounded-full mb-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">
            Something went wrong rendering this view
          </h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1 max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset?.();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer uppercase transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
