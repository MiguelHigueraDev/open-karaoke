import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { LyricsProvider } from './state/lyrics-context.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LyricsProvider>
      <App />
    </LyricsProvider>
  </StrictMode>,
);
