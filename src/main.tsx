import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Inicialización de Sentry para observabilidad y telemetría de excepciones en producción
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

Sentry.init({
  dsn: SENTRY_DSN || undefined,
  // Activo automáticamente si hay DSN configurado o en entorno de producción
  enabled: Boolean(SENTRY_DSN) || import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE || 'production',
  ignoreErrors: [
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',
    'NetworkError when attempting to fetch resource',
    'failed to connect to websocket'
  ],
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Interrupción en Sistema CIMIENTO">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

