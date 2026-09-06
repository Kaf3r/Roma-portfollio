const STORAGE_KEY = 'kanban-tasks';
const board = document.getElementById('kanbanBoard');
const searchInput = document.getElementById('kanbanSearch');
const filterSelect = document.getElementById('kanbanFilter');
const addBtn = document.getElementById('kanbanAdd');
const modal = document.getElementById('taskModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalDelete = document.getElementById('modalDelete');
const modalTitle = document.getElementById('modalTitle');
const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDesc');
const noResults = document.getElementById('kanbanNoResults');

let draggedTaskId = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  const tasks = loadTasks();
  const query = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;

  return tasks.filter(task => {
    const matchesSearch = !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);
    const matchesFilter = filter === 'all' || task.status === filter;
    return matchesSearch && matchesFilter;
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderBoard() {
  const tasks = getFilteredTasks();
  const columns = {
    todo: document.querySelector('.kanban-column__body[data-status="todo"]'),
    inProgress: document.querySelector('.kanban-column__body[data-status="inProgress"]'),
    done: document.querySelector('.kanban-column__body[data-status="done"]')
  };

  Object.values(columns).forEach(col => (col.innerHTML = ''));

  const counts = { todo: 0, inProgress: 0, done: 0 };

  tasks.forEach(task => {
    counts[task.status]++;

    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = task.id;

    card.innerHTML = `
      <div class="kanban-card__title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="kanban-card__desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="kanban-card__footer">
        <span class="kanban-card__date">${formatDate(task.createdAt)}</span>
        <div class="kanban-card__actions">
          <button class="kanban-card__action" data-action="edit" data-id="${task.id}">Изменить</button>
          <button class="kanban-card__action" data-action="delete" data-id="${task.id}">Удалить</button>
        </div>
      </div>
    `;

    columns[task.status].appendChild(card);
  });

  document.querySelectorAll('[data-count]').forEach(el => {
    const status = el.dataset.count;
    el.textContent = String(counts[status] || 0);
  });

  document.querySelectorAll('.kanban-empty').forEach(el => {
    const status = el.dataset.empty;
    el.classList.toggle('is-visible', counts[status] === 0);
  });

  const hasAny = tasks.length > 0;
  const hasSearch = searchInput.value.trim().length > 0;
  noResults.style.display = (hasSearch && !hasAny) ? 'block' : 'none';
  board.style.display = 'grid';
}

function openModal(mode = 'create', task = null) {
  modalTitle.textContent = mode === 'create' ? 'Новая задача' : 'Редактировать задачу';
  modalDelete.style.display = mode === 'edit' ? 'inline-flex' : 'none';

  if (mode === 'edit' && task) {
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
  } else {
    taskIdInput.value = '';
    taskTitleInput.value = '';
    taskDescInput.value = '';
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  taskTitleInput.focus();
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  taskForm.reset();
  taskIdInput.value = '';
}

function handleFormSubmit(e) {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const id = taskIdInput.value;

  if (!title) return;

  const tasks = loadTasks();

  if (id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], title, description };
      saveTasks(tasks);
    }
  } else {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveTasks(tasks);
  }

  closeModal();
  renderBoard();
}

function deleteCurrentTask() {
  const id = taskIdInput.value;
  if (!id) return;
  let tasks = loadTasks();
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  closeModal();
  renderBoard();
}

function setupDragAndDrop() {
  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    draggedTaskId = card.dataset.id;
    card.classList.add('kanban-card--dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('kanban-card--dragging');
    draggedTaskId = null;
    document.querySelectorAll('.kanban-column--drag-over').forEach(el => el.classList.remove('kanban-column--drag-over'));
  });

  board.addEventListener('dragover', e => {
    const column = e.target.closest('.kanban-column');
    if (!column || !draggedTaskId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    column.classList.add('kanban-column--drag-over');
  });

  board.addEventListener('dragleave', e => {
    const column = e.target.closest('.kanban-column');
    if (column && (!e.relatedTarget || !column.contains(e.relatedTarget))) {
      column.classList.remove('kanban-column--drag-over');
    }
  });

  board.addEventListener('drop', e => {
    const column = e.target.closest('.kanban-column');
    if (!column || !draggedTaskId) return;
    e.preventDefault();
    column.classList.remove('kanban-column--drag-over');

    const newStatus = column.dataset.status;
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === draggedTaskId);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      saveTasks(tasks);
      renderBoard();
    }
  });
}

function setupEventListeners() {
  addBtn.addEventListener('click', () => openModal('create'));

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  modalDelete.addEventListener('click', deleteCurrentTask);

  taskForm.addEventListener('submit', handleFormSubmit);

  searchInput.addEventListener('input', renderBoard);
  filterSelect.addEventListener('change', renderBoard);

  board.addEventListener('click', e => {
    const actionBtn = e.target.closest('.kanban-card__action');
    if (!actionBtn) return;
    const id = actionBtn.dataset.id;
    const action = actionBtn.dataset.action;
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (action === 'edit') {
      openModal('edit', task);
    } else if (action === 'delete') {
      const filtered = tasks.filter(t => t.id !== id);
      saveTasks(filtered);
      renderBoard();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

function init() {
  if (!board) return;
  setupDragAndDrop();
  setupEventListeners();
  renderBoard();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}