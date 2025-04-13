import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-[#0c0124] text-white pt-[9vh] flex flex-col items-center justify-center p-4">
          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-8 border border-red-600/30 shadow-xl max-w-lg w-full">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-6">
              Something went wrong 😢
            </h1>
            <div className="text-red-300 mb-4">
              <p>An error occurred while loading this page:</p>
              <pre className="bg-[#0a0019] p-3 rounded-lg mt-2 overflow-auto text-sm">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>
            <button 
              onClick={() => window.location.href = "/home"}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 