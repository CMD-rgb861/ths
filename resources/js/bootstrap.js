import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

axios.interceptors.request.use((config) => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
        config.headers.Authorization = `Bearer ${localToken}`;
    }

    if (!config.url) {
        return config;
    }

    if (!config.url.startsWith('http') && !config.url.startsWith('//') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    return config;
});

export default axios;