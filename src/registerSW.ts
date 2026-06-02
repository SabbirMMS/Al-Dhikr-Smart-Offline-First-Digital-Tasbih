export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registered successfully', reg.scope);
        })
        .catch((err) => {
          console.error('[SW] Service Worker registration failed', err);
        });
    });
  }
}
