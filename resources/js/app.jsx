  //resources\js\app.jsx
import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App';
import '../css/app.css';
import axios from 'axios';

/*
|--------------------------------------------------------------------------
| AXIOS CONFIG (Sanctum Token Mode)
|--------------------------------------------------------------------------
*/

axios.defaults.baseURL = '/api';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// CSRF (optional)
const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content');

if (csrfToken) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// Bearer token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



/*
|--------------------------------------------------------------------------
| RENDER APP
|--------------------------------------------------------------------------
*/

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
