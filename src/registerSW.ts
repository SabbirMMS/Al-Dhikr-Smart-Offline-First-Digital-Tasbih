export function registerServiceWorker() {
  const isExtension = typeof window !== 'undefined' && 
    (window as any).chrome && 
    (window as any).chrome.runtime && 
    (window as any).chrome.runtime.id;

  if (isExtension) return;

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
