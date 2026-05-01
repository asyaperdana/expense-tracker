import { dom } from '../ui.js';
import * as calc from './calculations.js';

// ─── Toast Notifications ─────────────────
export function showToast(message, type) {
  type = type || 'success';
  let iconMap = {
    success: '<i class="ph-fill ph-check-circle" style="color: var(--clr-success);"></i>',
    warning: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-warning);"></i>',
    error: '<i class="ph-fill ph-warning-circle" style="color: var(--clr-danger);"></i>',
    info: '<i class="ph-fill ph-info" style="color: var(--clr-accent);"></i>',
  };
  let toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span class="toast-icon">' +
    (iconMap[type] || '<i class="ph-fill ph-check-circle"></i>') +
    '</span>' +
    '<span>' +
    calc.escapeHtml(message) +
    '</span>';
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2500);
}

export function showUndoToast(message, onUndo) {
  let toast = document.createElement('div');
  toast.className = 'toast toast-info';
  toast.innerHTML =
    '<span class="toast-icon"><i class="ph-bold ph-arrow-u-up-left" style="color: var(--clr-accent);"></i></span>' +
    '<span>' +
    calc.escapeHtml(message) +
    '</span>' +
    '<button class="toast-action" type="button">Undo</button>';
  let btn = toast.querySelector('.toast-action');
  btn.addEventListener('click', function () {
    if (onUndo) onUndo();
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  });
  dom.toastContainer.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 5000);
}
