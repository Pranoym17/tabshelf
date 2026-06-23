import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './Popup'
import ErrorBoundary from '../shared/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Popup />
    </ErrorBoundary>
  </React.StrictMode>
)
