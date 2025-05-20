import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3000} />
        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);