import { state, AVATAR_COLORS } from './state.js';
import { dom, showToast, renderToolsOverview } from '../ui.js';
import * as calc from './calculations.js';
import * as sharedLedgers from './shared-ledgers.js';

// ─── Split History ────────────────────────
export function renderSplitHistory() {
  dom.splitHistoryList.innerHTML = '';
  if (state.splitLedger.length === 0) {
    dom.splitHistoryList.innerHTML = '<p class="split-history-empty">Belum ada riwayat split</p>';
    return;
  }
  state.splitLedger.slice(0, 12).forEach(function (entry) {
    let payerText = entry.payerName ? ' • Dibayar: ' + calc.escapeHtml(entry.payerName) : '';
    let ownerText = entry.ownerName ? ' • Saya: ' + calc.escapeHtml(entry.ownerName) : '';
    let item = document.createElement('div');
    item.className = 'split-history-item';
    item.innerHTML =
      '<div><div class="hist-name">' +
      calc.escapeHtml(entry.billName) +
      '</div><div class="hist-meta">' +
      calc.formatDate(entry.date) +
      ' • ' +
      entry.people.length +
      ' peserta' +
      payerText +
      ownerText +
      '</div></div>' +
      '<span class="hist-amount">' +
      calc.formatRupiah(entry.total) +
      '</span>';
    dom.splitHistoryList.appendChild(item);
  });
}

// ─── Split Ledger Table ───────────────────
export function renderSplitLedgerTable() {
  if (!dom.splitLedgerTbody || !dom.splitLedgerEmpty) return;
  dom.splitLedgerTbody.innerHTML = '';
  if (state.splitLedger.length === 0) {
    dom.splitLedgerEmpty.classList.add('visible');
    renderToolsOverview();
    return;
  }
  dom.splitLedgerEmpty.classList.remove('visible');
  let fragment = document.createDocumentFragment();
  state.splitLedger.forEach(function (entry) {
    let tr = document.createElement('tr');
    let statusKey = entry.ownerStatusKey || 'even';
    let statusText = entry.ownerStatusText || 'Status belum tersedia';
    let isDone = Boolean(entry.isDone);
    let doneText = isDone
      ? 'Selesai' + (entry.doneAt ? ' • ' + calc.formatDate(entry.doneAt) : '')
      : statusText;
    let doneClass = isDone ? 'done' : statusKey;
    let syncDone = Boolean(entry.syncedExpenseId);
    let syncClass = syncDone ? 'synced' : 'pending';
    let syncText = syncDone
      ? 'Tersinkron' + (entry.syncedAt ? ' • ' + calc.formatDate(entry.syncedAt) : '')
      : 'Belum sync';
    let syncButton = '';
    if (syncDone) {
      syncButton =
        '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check-circle"></i> Tersinkron</button>';
    } else if (Number(entry.ownerShare) > 0) {
      syncButton =
        '<button class="btn btn-sm btn-primary" type="button" data-split-action="sync" data-id="' +
        entry.id +
        '"><i class="ph-bold ph-arrows-clockwise"></i> Sync</button>';
    } else {
      syncButton =
        '<button class="btn btn-sm btn-ghost" type="button" disabled>Tidak ada porsi</button>';
    }
    let doneButton = isDone
      ? '<button class="btn btn-sm btn-ghost" type="button" disabled><i class="ph-bold ph-check"></i> Selesai</button>'
      : '<button class="btn btn-sm btn-ghost" type="button" data-split-action="done" data-id="' +
        entry.id +
        '"><i class="ph-bold ph-check-circle"></i> Mark Done</button>';
    let deleteButton =
      '<button class="btn btn-sm btn-delete" type="button" data-split-action="delete" data-id="' +
      entry.id +
      '"><i class="ph-bold ph-trash"></i> Hapus</button>';
    let actionHtml =
      '<div class="action-group"><button class="btn btn-sm btn-edit" type="button" data-split-action="edit" data-id="' +
      entry.id +
      '"><i class="ph-bold ph-pencil-simple"></i> Edit</button>' +
      doneButton +
      syncButton +
      deleteButton +
      '</div>';
    tr.innerHTML =
      '<td data-label="Tanggal">' +
      calc.formatDate(entry.date) +
      '</td>' +
      '<td data-label="Bill"><div class="split-ledger-bill-name">' +
      calc.escapeHtml(entry.billName) +
      '</div><div class="split-ledger-bill-meta">Saya: ' +
      calc.escapeHtml(entry.ownerName || '-') +
      ' • Dibayar: ' +
      calc.escapeHtml(entry.payerName || '-') +
      '</div></td>' +
      '<td class="text-right" data-label="Total"><strong class="split-ledger-amount">' +
      calc.formatRupiah(entry.total) +
      '</strong></td>' +
      '<td class="text-right" data-label="Porsi Saya"><strong class="split-ledger-amount">' +
      calc.formatRupiah(entry.ownerShare || 0) +
      '</strong></td>' +
      '<td data-label="Status Saya"><span class="split-ledger-status ' +
      doneClass +
      '">' +
      calc.escapeHtml(doneText) +
      '</span></td>' +
      '<td data-label="Sync"><span class="split-ledger-sync ' +
      syncClass +
      '">' +
      calc.escapeHtml(syncText) +
      '</span></td>' +
      '<td class="text-center" data-label="Aksi">' +
      actionHtml +
      '</td>';
    fragment.appendChild(tr);
  });
  dom.splitLedgerTbody.appendChild(fragment);
  renderToolsOverview();
}

// ─── Split Results ────────────────────────
export function renderSplitResults(results) {
  state.splitResults = results; // Also sync state
  dom.splitFormView.style.display = 'none';
  dom.splitResultsView.style.display = 'block';
  dom.splitResultSummary.innerHTML =
    '<p>' + calc.escapeHtml(results.billName) + '</p>' +
    '<strong>' + calc.formatRupiah(results.total) + '</strong>' +
    '<div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--clr-text-2);">' +
    results.people.length + ' peserta • ' +
    (results.mode === 'equal' ? 'Bagi Rata' : 'Custom') +
    '</div>' +
    '<div style="margin-top: 0.75rem; border-top: 1px dashed color-mix(in srgb, var(--clr-primary) 20%, transparent); padding-top: 0.75rem;">' +
    '<div style="margin-bottom: 0.25rem;">Dibayar oleh: <b>' + calc.escapeHtml(results.payerName) + '</b></div>' +
    '<div>Status <b>' + calc.escapeHtml(results.ownerName) + '</b>: <span style="color: var(--clr-primary); font-weight: 600;">' + calc.escapeHtml(results.ownerStatusText) + '</span></div>' +
    '</div>';
  dom.splitResultList.innerHTML = '';
  results.people.forEach(function (p, i) {
    let color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    let initials = p.name
      .split(' ')
      .map(function (w) {
        return w[0];
      })
      .slice(0, 2)
      .join('')
      .toUpperCase();
    let settlementText = 'Lunas';
    let settlementClass = 'even';
    if (p.net > 0) {
      settlementText = 'Harus terima ' + calc.formatRupiah(p.net);
      settlementClass = 'receive';
    } else if (p.net < 0) {
      settlementText = 'Harus bayar ' + calc.formatRupiah(Math.abs(p.net));
      settlementClass = 'pay';
    }
    let item = document.createElement('div');
    item.className = 'split-result-item';
    item.style.animationDelay = i * 0.06 + 's';
    item.innerHTML =
      '<div class="person-info"><div class="person-avatar" style="background:' +
      color +
      '">' +
      initials +
      '</div><div class="person-text"><span class="person-name">' +
      calc.escapeHtml(p.name) +
      (p.id === results.payerId ? ' (Pembayar)' : '') +
      (p.id === results.ownerId ? ' (Saya)' : '') +
      '</span><span class="person-detail">Bayar: ' +
      calc.formatRupiah(p.paid) +
      '</span></div></div>' +
      '<div class="person-result"><span class="person-share">Porsi: ' +
      calc.formatRupiah(p.share) +
      '</span><span class="person-settlement ' +
      settlementClass +
      '">' +
      settlementText +
      '</span></div>';
    dom.splitResultList.appendChild(item);
  });
}

// ─── Split Modal Helpers ──────────────────
export function updateSplitModalHeader() {
  if (!dom.splitTitleEl || !dom.btnSaveSplit) return;
  if (state.splitEditingId) {
    dom.splitTitleEl.innerHTML = '<i class="ph-bold ph-pencil-simple"></i> Edit Split Bill';
    dom.btnSaveSplit.innerHTML = '<i class="ph-bold ph-check-circle"></i> Update Ledger Split';
  } else {
    dom.splitTitleEl.innerHTML = '<i class="ph-bold ph-receipt"></i> Split Bill';
    dom.btnSaveSplit.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Simpan ke Ledger Split';
  }
}

export function applySplitMode(mode) {
  state.splitMode = mode === 'custom' ? 'custom' : 'equal';
  if (state.splitMode === 'equal') {
    dom.modeEqual.classList.add('active');
    dom.modeCustom.classList.remove('active');
  } else {
    dom.modeCustom.classList.add('active');
    dom.modeEqual.classList.remove('active');
  }
  updateCustomAmountVisibility();
}

export function updateCustomAmountVisibility() {
  let fields = dom.splitPersonList.querySelectorAll('.custom-amount');
  fields.forEach(function (f) {
    if (state.splitMode === 'custom') f.classList.add('visible');
    else f.classList.remove('visible');
  });
}

export function addPersonRow(name) {
  let personId = 'p-' + ++state.splitPersonIdCounter;
  let row = document.createElement('div');
  row.className = 'split-person-row';
  row.dataset.personId = personId;
  row.innerHTML =
    '<input type="text" class="person-name-input" placeholder="Nama peserta" value="' +
    calc.escapeHtml(name || '') +
    '" />' +
    '<input type="text" class="custom-amount' +
    (state.splitMode === 'custom' ? ' visible' : '') +
    '" placeholder="Nominal" inputmode="numeric" />' +
    '<button class="btn-remove-person" title="Hapus" type="button">×</button>';
  row.querySelector('.btn-remove-person').addEventListener('click', function () {
    if (dom.splitPersonList.children.length > 2) {
      row.remove();
      syncSplitPayerOptions();
    } else {
      showToast('Minimal 2 peserta', 'error');
    }
  });
  dom.splitPersonList.appendChild(row);
  syncSplitPayerOptions();
  return row;
}

export function getSplitParticipantLabel(row, index) {
  let nameInput = row.querySelector('.person-name-input');
  let name = nameInput ? nameInput.value.trim() : '';
  return name || 'Peserta ' + (index + 1);
}

export function syncSplitPayerOptions() {
  if (!dom.splitPayer) return;
  let rows = dom.splitPersonList.querySelectorAll('.split-person-row');
  let prevPayerId = dom.splitPayer.value;
  let hasPrev = false;
  let firstId = '';
  dom.splitPayer.innerHTML = '';
  rows.forEach(function (row, i) {
    let personId = row.dataset.personId || 'p-auto-' + i;
    row.dataset.personId = personId;
    let opt = document.createElement('option');
    opt.value = personId;
    opt.textContent = getSplitParticipantLabel(row, i);
    dom.splitPayer.appendChild(opt);
    if (!firstId) firstId = personId;
    if (personId === prevPayerId) hasPrev = true;
  });
  if (!firstId) return;
  dom.splitPayer.value = hasPrev ? prevPayerId : firstId;
}

// ─── Shared Ledgers UI ───────────────────

export function renderSharedLedgerList(ledgers, onSelect, onCreate) {
  const container = document.getElementById('shared-ledger-list');
  if (!container) return;

  if (ledgers.length === 0) {
    container.innerHTML = `
      <div class="ledger-empty">
        <div class="ledger-empty-icon">👥</div>
        <h3 class="ledger-empty-title">Belum ada grup patungan</h3>
        <p class="ledger-empty-text">Buat grup untuk mencatat patungan dengan teman</p>
        <button class="btn btn-primary" id="btn-create-ledger">Buat Grup Baru</button>
      </div>
    `;
    const createBtn = document.getElementById('btn-create-ledger');
    if (createBtn && onCreate) {
      createBtn.addEventListener('click', onCreate);
    }
    return;
  }

  container.innerHTML = ledgers
    .map(
      (ledger) => `
    <div class="ledger-card ${ledger.isArchived ? 'archived' : ''}" data-ledger-id="${ledger.id}">
      <div class="ledger-card-header">
        <h3 class="ledger-card-title">${calc.escapeHtml(ledger.name)}</h3>
        ${getLedgerStatusBadge(ledger)}
      </div>
      ${ledger.description ? `<p class="ledger-card-description">${calc.escapeHtml(ledger.description)}</p>` : ''}
      <div class="ledger-card-meta">
        <div class="ledger-member-avatars">
          ${ledger.members
            .map(
              (m) => `
            <div class="ledger-member-avatar" style="background: ${m.color}" title="${calc.escapeHtml(m.name)}">
              ${m.name.charAt(0).toUpperCase()}
            </div>
          `
            )
            .join('')}
        </div>
        <span>${ledger.bills.length} tagihan</span>
        <span>•</span>
        <span>${formatRelativeDate(ledger.updatedAt)}</span>
      </div>
    </div>
  `
    )
    .join('');

  // Add click handlers
  container.querySelectorAll('.ledger-card').forEach((card) => {
    card.addEventListener('click', () => {
      const ledgerId = card.dataset.ledgerId;
      const ledger = ledgers.find((l) => l.id === ledgerId);
      if (ledger && onSelect) onSelect(ledger);
    });
  });
}

function getLedgerStatusBadge(ledger) {
  const settlement = sharedLedgers.calculateSettlement(ledger);
  if (settlement.isSettled) {
    return '<span class="ledger-status-badge ledger-status-settled">✓ Lunas</span>';
  }
  return '<span class="ledger-status-badge ledger-status-pending">⏳ Ada utang</span>';
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function renderSharedLedgerDetail(ledger, onBack, onAddBill, onShare) {
  const container = document.getElementById('shared-ledger-detail');
  if (!container) return;

  const settlement = sharedLedgers.calculateSettlement(ledger);

  container.innerHTML = `
    <div class="ledger-detail">
      <div class="ledger-detail-header">
        <div>
          <h1 class="ledger-detail-title">${calc.escapeHtml(ledger.name)}</h1>
          ${ledger.description ? `<p class="ledger-detail-description">${calc.escapeHtml(ledger.description)}</p>` : ''}
        </div>
        <div class="ledger-detail-actions">
          <button class="btn btn-ghost" id="btn-ledger-back">← Kembali</button>
          <button class="btn btn-primary" id="btn-add-ledger-bill">+ Tambah Tagihan</button>
        </div>
      </div>

      ${renderSettlementCard(settlement)}

      <div class="member-balances">
        ${Object.values(settlement.memberBalances)
          .map(
            (m) => `
          <div class="member-balance-card">
            <div class="member-balance-avatar" style="background: ${m.color}">
              ${m.name.charAt(0).toUpperCase()}
            </div>
            <div class="member-balance-info">
              <div class="member-balance-name">${calc.escapeHtml(m.name)}</div>
              <div class="member-balance-amount ${getBalanceClass(m.net)}">
                ${m.net > 0 ? '+' : m.net < 0 ? '-' : ''} Rp ${Math.abs(m.net).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="ledger-bills">
        <h3>Daftar Tagihan (${ledger.bills.length})</h3>
        ${ledger.bills
          .map(
            (bill) => `
          <div class="ledger-bill-item">
            <div class="ledger-bill-info">
              <div class="ledger-bill-name">${calc.escapeHtml(bill.billName)}</div>
              <div class="ledger-bill-meta">${calc.formatDate(bill.date)} • ${bill.people.length} orang</div>
            </div>
            <div class="ledger-bill-amount">Rp ${(bill.total || 0).toLocaleString('id-ID')}</div>
          </div>
        `
          )
          .join('')}
      </div>

      <div style="margin-top: var(--space-6); text-align: center;">
        <button class="ledger-share-btn" id="btn-share-ledger">
          <i class="ph-bold ph-share-network"></i> Bagikan Ringkasan
        </button>
      </div>
    </div>
  `;

  // Add event handlers
  const backBtn = document.getElementById('btn-ledger-back');
  if (backBtn && onBack) backBtn.addEventListener('click', onBack);

  const addBtn = document.getElementById('btn-add-ledger-bill');
  if (addBtn && onAddBill) addBtn.addEventListener('click', onAddBill);

  const shareBtn = document.getElementById('btn-share-ledger');
  if (shareBtn && onShare) shareBtn.addEventListener('click', () => onShare(ledger));
}

function renderSettlementCard(settlement) {
  if (settlement.isSettled) {
    return `
      <div class="settlement-card settlement-status">
        <div class="settlement-status-icon">🎉</div>
        <h3 class="settlement-status-title">Semua sudah lunas!</h3>
        <p class="settlement-status-subtitle">Tidak ada utang piutang</p>
      </div>
    `;
  }

  return `
    <div class="settlement-card">
      <h3 style="margin-bottom: var(--space-4);">💰 Yang harus dibayar:</h3>
      <div class="settlement-transactions">
        ${settlement.transactions
          .map(
            (t) => `
          <div class="settlement-transaction">
            <div class="settlement-transaction-parties">
              <div class="settlement-transaction-from">
                <span>${calc.escapeHtml(t.fromName)}</span>
              </div>
              <span class="settlement-transaction-arrow">→</span>
              <div class="settlement-transaction-to">
                <span>${calc.escapeHtml(t.toName)}</span>
              </div>
            </div>
            <div class="settlement-transaction-amount">
              Rp ${t.amount.toLocaleString('id-ID')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function getBalanceClass(net) {
  if (net > 0) return 'member-balance-positive';
  if (net < 0) return 'member-balance-negative';
  return 'member-balance-neutral';
}

export async function copyLedgerSummaryToClipboard(ledger) {
  const summary = sharedLedgers.generateShareableSummary(ledger);
  try {
    await navigator.clipboard.writeText(summary);
    return true;
  } catch (err) {
    return false;
  }
}
