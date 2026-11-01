import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('PantryPal rendering error:', {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
  }

  handleRecover = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="page error-boundary-page">
      <section className="panel error-boundary-card" role="alert">
        <p className="eyebrow">PantryPal error</p>
        <h1>We could not load this page</h1>
        <p>Something went wrong while rendering the application. Your data has not been changed.</p>
        <button className="btn" type="button" onClick={this.handleRecover}>Reload PantryPal</button>
      </section>
    </main>;
  }
}
