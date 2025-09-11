import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import ziggyRoute from 'ziggy-js';
import { Ziggy } from './ziggy';

window.route = (name, params, absolute, config = Ziggy) => ziggyRoute(name, params, absolute, config);

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