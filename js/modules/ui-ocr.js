import { dom, setOcrProgress, setOcrStatus } from '../ui.js';
import * as calc from './calculations.js';

// ─── OCR UI Helpers ───────────────────────
export function renderOcrResults(parsed, confidence) {
  if (!dom.ocrResults || !dom.ocrTotalValue || !dom.ocrItemList) return;

  // Support legacy call signature: renderOcrResults(items, total)
  let items, total, storeName, date, tax, discount, paymentMethod;
  if (Array.isArray(parsed)) {
    items = parsed;
    total = confidence || 0;
    confidence = null;
    storeName = '';
    date = null;
    tax = 0;
    discount = 0;
    paymentMethod = '';
  } else {
    items = parsed.items || [];
    total = parsed.total || 0;
    storeName = parsed.storeName || '';
    date = parsed.date || null;
    tax = parsed.tax || 0;
    discount = parsed.discount || 0;
    paymentMethod = parsed.paymentMethod || '';
  }

  // ── Confidence badge
  let confidenceBadge = '';
  if (confidence != null && Number.isFinite(confidence)) {
    let confLevel = confidence >= 80 ? 'high' : confidence >= 60 ? 'mid' : 'low';
    let confLabel = confidence >= 80 ? 'Akurasi Tinggi' : confidence >= 60 ? 'Akurasi Sedang' : 'Akurasi Rendah';
    confidenceBadge =
      '<span class="ocr-confidence-badge ocr-conf-' + confLevel + '">' +
      '<i class="ph-bold ph-chart-bar"></i> ' +
      confLabel + ' (' + Math.round(confidence) + '%)' +
      '</span>';
  }

  // ── Store + date metadata row
  let metaHtml = '';
  if (storeName || date) {
    metaHtml = '<div class="ocr-meta-row">';
    if (storeName) {
      metaHtml += '<span class="ocr-meta-store"><i class="ph-bold ph-storefront"></i> ' + calc.escapeHtml(storeName) + '</span>';
    }
    if (date) {
      metaHtml += '<span class="ocr-meta-date"><i class="ph-bold ph-calendar"></i> ' + calc.formatDate(date) + '</span>';
    }
    if (paymentMethod) {
      metaHtml += '<span class="ocr-meta-payment"><i class="ph-bold ph-credit-card"></i> ' + calc.escapeHtml(paymentMethod) + '</span>';
    }
    metaHtml += '</div>';
  }

  // Inject confidence + meta above the total row
  let ocrHeader = dom.ocrResults.querySelector('.ocr-header-meta');
  if (!ocrHeader) {
    ocrHeader = document.createElement('div');
    ocrHeader.className = 'ocr-header-meta';
    dom.ocrResults.insertBefore(ocrHeader, dom.ocrResults.firstChild);
  }
  ocrHeader.innerHTML = confidenceBadge + metaHtml;

  // ── Total value
  dom.ocrTotalValue.textContent = calc.formatRupiah(total);

  // ── Tax / discount annotation (injected next to total row)
  let ocrTotalRow = dom.ocrResults.querySelector('.ocr-total-row');
  let ocrBreakdown = dom.ocrResults.querySelector('.ocr-breakdown');
  if (!ocrBreakdown && ocrTotalRow) {
    ocrBreakdown = document.createElement('div');
    ocrBreakdown.className = 'ocr-breakdown';
    ocrTotalRow.insertAdjacentElement('afterend', ocrBreakdown);
  }
  if (ocrBreakdown) {
    let breakdownParts = [];
    if (tax > 0) breakdownParts.push('<span class="ocr-bd-tax"><i class="ph-bold ph-percent"></i> Pajak/SC: ' + calc.formatRupiah(tax) + '</span>');
    if (discount > 0) breakdownParts.push('<span class="ocr-bd-disc"><i class="ph-bold ph-tag"></i> Diskon: ' + calc.formatRupiah(discount) + '</span>');
    ocrBreakdown.innerHTML = breakdownParts.length ? breakdownParts.join('') : '';
    ocrBreakdown.style.display = breakdownParts.length ? 'flex' : 'none';
  }

  // ── Item list
  dom.ocrItemList.innerHTML = '';
  if (items.length === 0) {
    dom.ocrItemList.innerHTML =
      '<div class="ocr-error"><i class="ph-bold ph-warning-circle"></i> Tidak ada item terdeteksi dari nota</div>';
  } else {
    items.forEach(function (item) {
      let row = document.createElement('div');
      row.className = 'ocr-item-row';
      let qtyLabel = item.qty > 1
        ? '<span class="ocr-item-qty">' + item.qty + '×</span> '
        : '';
      row.innerHTML =
        '<span class="ocr-item-name">' + qtyLabel + calc.escapeHtml(item.name) + '</span>' +
        '<span class="ocr-item-price">' + calc.formatRupiah(item.price) + '</span>';
      dom.ocrItemList.appendChild(row);
    });
  }

  dom.ocrResults.style.display = 'block';
  setOcrStatus('Selesai — ' + items.length + ' item ditemukan');
  setOcrProgress(100);
}

export function resetOcrPanel() {
  if (dom.ocrPreviewPanel) dom.ocrPreviewPanel.style.display = 'none';
  if (dom.ocrResults) dom.ocrResults.style.display = 'none';
  if (dom.ocrItemList) dom.ocrItemList.innerHTML = '';
  if (dom.ocrTotalValue) dom.ocrTotalValue.textContent = 'Rp 0';
  // Clear injected elements
  let ocrHeader = dom.ocrResults && dom.ocrResults.querySelector('.ocr-header-meta');
  if (ocrHeader) ocrHeader.innerHTML = '';
  let ocrBreakdown = dom.ocrResults && dom.ocrResults.querySelector('.ocr-breakdown');
  if (ocrBreakdown) { ocrBreakdown.innerHTML = ''; ocrBreakdown.style.display = 'none'; }
  setOcrProgress(0);
  setOcrStatus('Memproses...');
  if (dom.ocrFileInput) dom.ocrFileInput.value = '';
}
