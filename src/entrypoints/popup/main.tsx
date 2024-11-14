import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Settings from './Settings.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <MemoryRouter>
        <Routes>
          <Route path="settings" element={<Settings />} />
          <Route path="/" element={<App />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>
  </React.StrictMode>,
);
