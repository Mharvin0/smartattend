import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
}

// If the session/CSRF token has expired during an AJAX/Inertia request,
// automatically reload to obtain a fresh session and token.
window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error?.response?.status === 419) {
            window.location.reload();
            return;
        }
        return Promise.reject(error);
    }
);
