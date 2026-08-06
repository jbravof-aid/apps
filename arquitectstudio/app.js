if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('SW registrado'))
    .catch(err => console.error(err));
}

document.getElementById('app-status').textContent = 'PWA Lista para usar sin conexión!';

document.getElementById('action-btn').addEventListener('click', () => {
  alert('¡Hola desde tu PWA instalable!');
});