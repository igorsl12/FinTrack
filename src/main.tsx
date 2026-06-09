import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './index.css';
import { bootstrapTheme, installThemeWatcher } from './features/theme/store/themeStore';

// Apply the persisted theme synchronously before React renders so the user
// never sees a flash of the wrong palette.
bootstrapTheme();
installThemeWatcher();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
