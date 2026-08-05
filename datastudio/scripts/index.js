// Lógica de interacción en scripts/index.js con Bootstrap 5
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const htmlEl = document.documentElement;
      const currentTheme = htmlEl.getAttribute('data-bs-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-bs-theme', newTheme);
      themeToggleBtn.innerHTML = newTheme === 'dark' 
        ? '<i class="bi bi-moon-stars"></i>' 
        : '<i class="bi bi-sun"></i>';
    });
  }

  // Hero Button Toast / Action
  const btnHeroAction = document.getElementById('btn-hero-action');
  if (btnHeroAction) {
    btnHeroAction.addEventListener('click', () => {
      alert('¡Excelente! Estás utilizando Bootstrap 5 en tu nueva PWA.');
    });
  }

  // Bootstrap Task List Demo
  const taskForm = document.getElementById('bootstrap-task-form');
  const taskInput = document.getElementById('task-text-input');
  const taskList = document.getElementById('bootstrap-task-list');

  let tasks = JSON.parse(localStorage.getItem('pwa_bs_tasks') || '[]');

  function saveAndRender() {
    localStorage.setItem('pwa_bs_tasks', JSON.stringify(tasks));
    if (!taskList) return;
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      taskList.innerHTML = '<li class="list-group-item text-muted text-center py-3 fs-7">No hay tareas pendientes</li>';
      return;
    }

    tasks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center bg-body-tertiary';
      li.innerHTML = `
        <span class="${t.done ? 'text-decoration-line-through text-muted' : ''}">${escapeHtml(t.text)}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-success" onclick="toggleBsTask(${i})">
            <i class="bi ${t.done ? 'bi-check-circle-fill' : 'bi-circle'}"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteBsTask(${i})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      taskList.appendChild(li);
    });
  }

  window.toggleBsTask = function(i) {
    tasks[i].done = !tasks[i].done;
    saveAndRender();
  };

  window.deleteBsTask = function(i) {
    tasks.splice(i, 1);
    saveAndRender();
  };

  if (taskForm && taskInput) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = taskInput.value.trim();
      if (val) {
        tasks.push({ text: val, done: false });
        taskInput.value = '';
        saveAndRender();
      }
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
  }

  saveAndRender();
});