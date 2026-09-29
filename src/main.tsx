import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Inicialización de Sentry con protección estricta de PII (Habeas Data / Ley 1581)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

Sentry.init({
  dsn: SENTRY_DSN || undefined,
  enabled: Boolean(SENTRY_DSN),
  sendDefaultPii: false,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE || 'production',
  beforeSend(event) {
    // Sanitización estricta de datos personales y sensibles antes de despachar a la nube
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
      delete event.user.username;
    }
    // Redactar patrones de correos o números de documento en breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => {
        if (typeof b.message === 'string') {
          b.message = b.message
            .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[EMAIL_REDACTED]')
            .replace(/\b\d{7,10}\b/g, '[DOC_REDACTED]');
        }
        return b;
      });
    }
    return event;
  },
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
