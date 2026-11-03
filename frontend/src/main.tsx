import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// index.html carries default tags for bots that skip JavaScript. Once the app runs,
// each page renders its own via <Seo>, so drop the defaults to avoid duplicates.
document.head.querySelectorAll('[data-seo-default]').forEach((el) => el.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
