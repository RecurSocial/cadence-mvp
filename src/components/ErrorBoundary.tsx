'use client';

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <p className="text-yellow-700 font-semibold">⚠️ Unable to load data</p>
          <p className="text-yellow-600 text-sm mt-1">The dashboard is trying to load data from the database.</p>
          <p className="text-yellow-600 text-sm">Make sure Supabase tables are set up and try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
