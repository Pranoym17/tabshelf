import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center">
          <span className="text-3xl mb-3" aria-hidden>⚠️</span>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Something went wrong
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 text-xs text-indigo-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
