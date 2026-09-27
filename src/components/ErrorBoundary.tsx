import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm('Системийн хөтчийн кэш болон хадгалсан өгөгдлийг цэвэрлэж анхны байдалд оруулах уу?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Storage clear error:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-slate-800 text-center mb-2">
              Системийг ачаалахад алдаа гарлаа
            </h1>
            <p className="text-sm text-slate-600 text-center mb-6">
              Хөтчийн өгөгдөл эсвэл сүлжээний асуудлаас шалтгаалан дэлгэц ачаалагдах боломжгүй боллоо. Дараах үйлдлүүдийг хийж үзнэ үү.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 overflow-x-auto text-xs font-mono text-rose-700">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition"
              >
                <RefreshCw className="w-4 h-4" />
                Хуудсыг дахин ачаалах
              </button>

              <button
                onClick={this.handleResetStorage}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
                Кэш цэвэрлээд дахин орох
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
