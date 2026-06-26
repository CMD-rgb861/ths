import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

axios.interceptors.request.use((config) => {
    if (!config.url) {
        return config;
    }

    if (!config.url.startsWith('http') && !config.url.startsWith('//') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    return config;
});

const apiToken = localStorage.getItem('token');
if (apiToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${apiToken}`;
}

export default axios;