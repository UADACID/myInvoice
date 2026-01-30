import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { db } from '@/storage/database';
import { initializeDefaultSettings } from '@/utils/initializeSettings';

// Initialize database and default settings
db.open()
  .then(() => initializeDefaultSettings())
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
