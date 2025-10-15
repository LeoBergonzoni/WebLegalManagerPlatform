'use client';

import {Component, type ErrorInfo, type ReactNode} from 'react';

type ErrorBoundaryState = {hasError: boolean};
type ErrorBoundaryProps = {children: ReactNode};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-sm text-[#cfd3da]">Something went wrong on this section.</div>;
    }

    return this.props.children;
  }
}
