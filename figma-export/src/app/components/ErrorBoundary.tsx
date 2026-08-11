import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error | null;
    resetError: () => void;
  }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-fg)'
          }}
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle 
                className="h-16 w-16" 
                style={{ color: 'var(--theme-muted)' }} 
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl tracking-wide">Something went wrong</h1>
              <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.resetError}
                variant="outline"
                style={{ 
                  borderColor: 'var(--theme-fg)',
                  color: 'var(--theme-fg)',
                  backgroundColor: 'transparent'
                }}
                className="w-full transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                style={{ color: 'var(--theme-muted)' }}
                className="w-full hover:opacity-80"
              >
                Refresh Page
              </Button>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-6">
                <summary 
                  className="cursor-pointer text-sm"
                  style={{ color: 'var(--theme-muted)' }}
                >
                  Error Details (Development)
                </summary>
                <div 
                  className="mt-2 p-3 text-xs rounded border"
                  style={{ 
                    backgroundColor: 'var(--theme-accent)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-muted)'
                  }}
                >
                  <div className="font-medium mb-2">Error:</div>
                  <div className="mb-3">{this.state.error.message}</div>
                  
                  <div className="font-medium mb-2">Stack Trace:</div>
                  <pre className="whitespace-pre-wrap break-all">
                    {this.state.error.stack}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <div className="font-medium mb-2 mt-3">Component Stack:</div>
                      <pre className="whitespace-pre-wrap break-all">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;