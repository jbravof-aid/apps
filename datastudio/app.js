// Registro del Service Worker para PWA Bootstrap
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Bootstrap registrado:', reg.scope))
      .catch(err => console.error('Error Service Worker:', err));
  });
}

// Control del estado de la red (Online/Offline)
const pwaStatusBadge = document.getElementById('pwa-status-badge');

function updateNetworkBadge() {
  if (!pwaStatusBadge) return;
  if (navigator.onLine) {
    pwaStatusBadge.className = 'badge rounded-pill text-bg-success py-2 px-3';
    pwaStatusBadge.innerHTML = '<i class="bi bi-wifi me-1"></i>Online';
  } else {
    pwaStatusBadge.className = 'badge rounded-pill text-bg-warning py-2 px-3';
    pwaStatusBadge.innerHTML = '<i class="bi bi-wifi-off me-1"></i>Offline (Caché Activo)';
  }
}

window.addEventListener('online', updateNetworkBadge);
window.addEventListener('offline', updateNetworkBadge);
updateNetworkBadge();

// Promoción de Instalación PWA
let deferredPrompt;
const installAlert = document.getElementById('pwa-install-alert');
const btnInstallPwa = document.getElementById('btn-pwa-install');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installAlert) installAlert.classList.remove('d-none');
});

if (btnInstallPwa) {
  btnInstallPwa.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          console.log('El usuario instaló la PWA');
        }
        deferredPrompt = null;
        if (installAlert) installAlert.classList.add('d-none');
      });
    }
  });
}