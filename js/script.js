(() => {
  "use strict";

  const STORAGE_KEY = "expense_tracker_entries_v2";
  const LEGACY_STORAGE_KEY = "expense_tracker_data";

  function byId(...ids) {
    for (let i = 0; i < ids.length; i += 1) {
      const el = document.getElementById(ids[i]);
      if (el) return el;
    }
    return null;
  }

  const form = byId("expense-form");
  const dateInput = byId("expense-date", "input-date");
  const titleInput = byId("expense-title", "input-title");
  const categoryInput = byId("expense-category", "input-category");
  const amountInput = byId("expense-amount", "input-amount");
  const notesInput = byId("expense-notes", "input-notes");

  const tableBody = byId("expense-table-body", "expense-tbody");
  const emptyState = byId("empty-state");

  const totalSpentEl = byId("stat-total-spent", "total-expense");
  const totalCountEl = byId("stat-total-count", "total-count");
  const averageEl = byId("stat-average-expense");
  const topCategoryEl = byId("stat-top-category", "top-category");

  const chartCanvas = byId("expense-category-chart", "category-chart");
  const chartEmpty = byId("chart-empty");
  const toastRegion = byId("toast-region", "toast-container");

  const fieldRefs = {
    date: dateInput,
    title: titleInput,
    category: categoryInput,
    amount: amountInput,
  };

  const errorRefs = {
    date: byId("error-expense-date", "date-help"),
    title: byId("error-expense-title"),
    category: byId("error-expense-category", "category-help"),
    amount: byId("error-expense-amount", "amount-help"),
  };

  const criticalRefs = [form, dateInput, titleInput, categoryInput, amountInput, tableBody];
  if (criticalRefs.some((ref) => !ref)) {
    console.error("Expense tracker init aborted: required DOM elements not found.");
    return;
  }

  const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const numberFormatter = new Intl.NumberFormat(undefined);

  const chartColors = [
    "#2a9d8f",
    "#e76f51",
    "#264653",
    "#f4a261",
    "#457b9d",
    "#8ab17d",
    "#6d597a",
    "#ffb703",
    "#219ebc",
  ];

  let entries = loadEntries();
  let categoryChart = null;

  initialize();

  function initialize() {
    setDefaultDate();
    bindEvents();
    renderAll();
  }

  function bindEvents() {
    form.addEventListener("submit", onSubmit);
    form.addEventListener("reset", onReset);

    Object.keys(fieldRefs).forEach((key) => {
      const input = fieldRefs[key];
      if (!input) return;
      input.addEventListener("input", () => clearFieldError(key));
      input.addEventListener("change", () => clearFieldError(key));
    });

    tableBody.addEventListener("click", onTableClick);
  }

  function onSubmit(event) {
    event.preventDefault();

    const validation = validateForm();
    if (!validation.valid) {
      applyErrors(validation.errors);
      focusFirstInvalidField(validation.errors);
      showToast("Please fix highlighted fields.", "error");
      return;
    }

    clearAllErrors();

    const newEntry = {
      id: generateId(),
      date: validation.values.date,
      title: validation.values.title,
      category: validation.values.category,
      amount: validation.values.amount,
      notes: validation.values.notes,
      createdAt: Date.now(),
    };

    entries.unshift(newEntry);
    persistEntries();

    form.reset();
    setDefaultDate();
    renderAll();
    showToast("Expense added.");
  }

  function onReset() {
    clearAllErrors();
    window.setTimeout(setDefaultDate, 0);
    showToast("Form cleared.");
  }

  function onTableClick(event) {
    const button = event.target.closest("button[data-action='delete'], .btn-action-delete");
    if (!button) {
      return;
    }

    const id = button.dataset.id;
    if (!id) {
      return;
    }

    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return;
    }

    entries.splice(index, 1);
    persistEntries();
    renderAll();
    showToast("Expense deleted.");
  }

  function validateForm() {
    const values = {
      date: safeValue(dateInput),
      title: safeValue(titleInput),
      category: safeValue(categoryInput),
      amount: safeValue(amountInput),
      notes: safeValue(notesInput),
    };

    const errors = {};

    if (!values.date) {
      errors.date = "Date is required.";
    }

    if (!values.title) {
      errors.title = "Description is required.";
    } else if (values.title.length < 3) {
      errors.title = "Description must be at least 3 characters.";
    }

    if (!values.category) {
      errors.category = "Please select a category.";
    }

    const parsedAmount = Number.parseFloat(values.amount);
    if (!values.amount) {
      errors.amount = "Amount is required.";
    } else if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Amount must be greater than 0.";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      values: {
        date: values.date,
        title: values.title,
        category: values.category,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        notes: values.notes,
      },
    };
  }

  function applyErrors(errors) {
    Object.keys(fieldRefs).forEach((key) => {
      const input = fieldRefs[key];
      const errorEl = errorRefs[key];
      const message = errors[key] || "";

      if (errorEl) {
        errorEl.textContent = message;
      }

      if (!input) return;

      if (message) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
      } else {
        input.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
      }
    });
  }

  function clearAllErrors() {
    Object.keys(fieldRefs).forEach(clearFieldError);
  }

  function clearFieldError(key) {
    const input = fieldRefs[key];
    const errorEl = errorRefs[key];

    if (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
    }

    if (errorEl) {
      errorEl.textContent = "";
    }
  }

  function focusFirstInvalidField(errors) {
    const firstKey = ["date", "title", "category", "amount"].find((key) => errors[key]);
    if (firstKey && fieldRefs[firstKey]) {
      fieldRefs[firstKey].focus();
    }
  }

  function renderAll() {
    renderTable();
    renderSummary();
    renderCategoryChart();
  }

  function renderTable() {
    tableBody.innerHTML = "";

    if (!entries.length) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    entries
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((entry) => {
        const row = document.createElement("tr");

        row.appendChild(makeCell("Date", formatDate(entry.date)));
        row.appendChild(makeCell("Description", entry.title));
        row.appendChild(makeCell("Category", entry.category));

        const amountCell = makeCell("Amount", currencyFormatter.format(entry.amount));
        amountCell.classList.add("amount-cell");
        row.appendChild(amountCell);

        row.appendChild(makeCell("Notes", entry.notes || "-"));

        const actionCell = document.createElement("td");
        actionCell.dataset.label = "Actions";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn-delete btn-action-delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = entry.id;
        deleteButton.setAttribute("aria-label", `Delete expense: ${entry.title}`);
        deleteButton.textContent = "Delete";

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
      });
  }

  function renderSummary() {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const count = entries.length;
    const average = count ? total / count : 0;

    const categoryTotals = getCategoryTotals();
    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    if (totalSpentEl) totalSpentEl.textContent = currencyFormatter.format(total);
    if (totalCountEl) totalCountEl.textContent = numberFormatter.format(count);
    if (averageEl) averageEl.textContent = currencyFormatter.format(average);
    if (topCategoryEl) topCategoryEl.textContent = topCategoryEntry ? topCategoryEntry[0] : "-";
  }

  function renderCategoryChart() {
    if (!chartCanvas) {
      return;
    }

    if (typeof Chart === "undefined") {
      if (chartEmpty) {
        chartEmpty.hidden = false;
        chartEmpty.textContent = "Chart unavailable (library failed to load).";
      }
      return;
    }

    const categoryTotals = getCategoryTotals();
    const labels = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    if (!labels.length) {
      if (chartEmpty) chartEmpty.hidden = false;
      if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
      }
      return;
    }

    if (chartEmpty) chartEmpty.hidden = true;

    const chartData = {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: labels.map((_, index) => chartColors[index % chartColors.length]),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };

    if (categoryChart) {
      categoryChart.data = chartData;
      categoryChart.update();
      return;
    }

    const ctx = chartCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#132028",
              font: {
                weight: "600",
              },
            },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const label = context.label || "Category";
                const value = context.parsed || 0;
                return `${label}: ${currencyFormatter.format(value)}`;
              },
            },
          },
        },
      },
    });
  }

  function getCategoryTotals() {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = 0;
      }
      acc[entry.category] += entry.amount;
      return acc;
    }, {});
  }

  function makeCell(label, value) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    cell.textContent = value;
    return cell;
  }

  function setDefaultDate() {
    if (!dateInput || dateInput.value) {
      return;
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    dateInput.value = `${year}-${month}-${day}`;
  }

  function formatDate(isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }

    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function showToast(message, type = "success") {
    if (!toastRegion) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " toast--error" : ""}`;
    toast.textContent = message;

    toastRegion.appendChild(toast);

    if (toastRegion.children.length > 4) {
      toastRegion.removeChild(toastRegion.firstElementChild);
    }

    window.setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  function loadEntries() {
    const parsedNew = tryParseStorage(STORAGE_KEY);
    if (Array.isArray(parsedNew) && parsedNew.length) {
      return sanitizeEntries(parsedNew);
    }

    const parsedLegacy = tryParseStorage(LEGACY_STORAGE_KEY);
    if (Array.isArray(parsedLegacy) && parsedLegacy.length) {
      const migrated = sanitizeEntries(parsedLegacy);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }

    return [];
  }

  function tryParseStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_error) {
      return [];
    }
  }

  function sanitizeEntries(list) {
    return list
      .map((entry) => {
        const amountNumber = Number(entry.amount);

        return {
          id: String(entry.id || generateId()),
          date: String(entry.date || ""),
          title: String(entry.title || "").trim(),
          category: String(entry.category || "Other").trim(),
          amount: Number.isFinite(amountNumber) ? Math.abs(amountNumber) : 0,
          notes: String(entry.notes || "").trim(),
          createdAt: Number(entry.createdAt || entry.timestamp || Date.now()),
        };
      })
      .filter((entry) => entry.amount > 0 && entry.date && entry.title);
  }

  function persistEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function safeValue(input) {
    if (!input || typeof input.value !== "string") {
      return "";
    }
    return input.value.trim();
  }

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
})();
