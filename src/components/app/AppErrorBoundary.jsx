import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Неизвестная ошибка",
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep logs for debugging in browser console.
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-main py-10">
          <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-soft">
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Страница временно недоступна</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Сработала защита от белого экрана. Ошибка перехвачена, приложение не упало полностью.
            </p>
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{this.state.message}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white transition hover:scale-105 active:scale-[0.97]"
              >
                Обновить страницу
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:scale-105 active:scale-[0.97]"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
