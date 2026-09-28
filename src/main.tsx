import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SystemBridgeProvider } from './services/systemBridge';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemBridgeProvider>
      <App />
    </SystemBridgeProvider>
  </StrictMode>,
);
