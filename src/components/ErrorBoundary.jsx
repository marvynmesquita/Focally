import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 bg-red-500/10 border border-red-500/20 rounded-xl m-4 text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Algo deu errado</h2>
                    <p className="text-gray-300 mb-4">{this.state.error?.message || "Ocorreu um erro inesperado."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
