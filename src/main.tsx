import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DemoEnvironmentBanner } from './components/common/DemoEnvironmentBanner';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DemoEnvironmentBanner />
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
