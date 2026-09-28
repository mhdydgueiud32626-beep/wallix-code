import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { RuntimeSyncIndicator } from './RuntimeSyncIndicator';

interface LivePreviewErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface LivePreviewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Preview Error Recovery Boundary.
 * Catches runtime/HMR render errors, prevents full application crashes,
 * displays a minimal developer recovery card, and automatically allows
 * reconnecting or retrying when source code is updated.
 */
export class LivePreviewErrorBoundary extends Component<
  LivePreviewErrorBoundaryProps,
  LivePreviewErrorBoundaryState
> {
  constructor(props: LivePreviewErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<LivePreviewErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LivePreviewErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wallix:runtime-sync', { detail: { status: 'error' } }));
    }
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wallix:runtime-sync', { detail: { status: 'live' } }));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] rounded-2xl bg-slate-950/90 border border-rose-500/30 p-6 flex flex-col items-center justify-center text-center backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <RuntimeSyncIndicator status="error" errorMessage={this.state.error?.message} onRetry={this.handleRetry} />
          </div>

          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-white font-['Outfit'] mb-1">
            {this.props.fallbackTitle || 'Preview Runtime Exception'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'An unexpected runtime issue occurred during module reconciliation.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Render</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            Editor remains active. Fix the component code or configuration to automatically restore live sync.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
