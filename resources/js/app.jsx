import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import ziggyRoute from 'ziggy-js';

// Ensure route() uses the current origin in production builds (prevents localhost URLs on Railway).
const ziggyBase =
    typeof window !== 'undefined' && window.Ziggy
        ? window.Ziggy
        : undefined;

const ziggyConfig =
    typeof window !== 'undefined' && window.location && ziggyBase
        ? {
              ...ziggyBase,
              url: window.location.origin,
              port: window.location.port ? parseInt(window.location.port, 10) : null,
          }
        : ziggyBase;

window.route = (name, params, absolute, config = ziggyConfig) => ziggyRoute(name, params, absolute, config);

createInertiaApp({
    title: (title) => `${title} - SmartAttend UPANG`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#3B4F26',
    },
});