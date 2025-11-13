import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const LOCAL_STORAGE_KEY = 'schoolSchedulerAppState';

export class ErrorBoundary extends Component<Props, State> {
  // FIX: Replaced the constructor with a state class field. This is a more modern
  // and concise way to initialize state in React class components and resolves
  // type errors where `this.state` and `this.props` were not recognized.
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error(`Failed to remove item '${LOCAL_STORAGE_KEY}' from localStorage`, e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Oops! Algo salió mal.</h1>
            <p className="text-gray-700 mb-6">
              Lo sentimos, la aplicación ha encontrado un error inesperado. Puedes intentar recargar la página o limpiar los datos de la aplicación para resolver el problema.
            </p>
            <details className="mb-6 text-left bg-gray-50 p-3 rounded-md">
              <summary className="font-semibold text-gray-600 cursor-pointer">Detalles del error</summary>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap break-all overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Limpiar datos y recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}