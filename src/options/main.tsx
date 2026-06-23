import React from 'react'
import ReactDOM from 'react-dom/client'
import Options from './Options'
import ErrorBoundary from '../shared/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Options />
    </ErrorBoundary>
  </React.StrictMode>
)
