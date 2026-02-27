(() => {
  "use strict";

  const STORAGE_KEY = "expense_tracker_entries_v2";

  const form = document.getElementById("expense-form");
  const dateInput = document.getElementById("expense-date");
  const titleInput = document.getElementById("expense-title");
  const categoryInput = document.getElementById("expense-category");
  const amountInput = document.getElementById("expense-amount");
  const notesInput = document.getElementById("expense-notes");

  const tableBody = document.getElementById("expense-table-body");
  const emptyState = document.getElementById("empty-state");

  const totalSpentEl = document.getElementById("stat-total-spent");
  const totalCountEl = document.getElementById("stat-total-count");
  const averageEl = document.getElementById("stat-average-expense");
  const topCategoryEl = document.getElementById("stat-top-category");

  const chartCanvas = document.getElementById("expense-category-chart");
  const chartEmpty = document.getElementById("chart-empty");
  const toastRegion = document.getElementById("toast-region");

  const fieldRefs = {
    date: dateInput,
    title: titleInput,
    category: categoryInput,
    amount: amountInput,
  };

  const errorRefs = {
    date: document.getElementById("error-expense-date"),
    title: document.getElementById("error-expense-title"),
    category: document.getElementById("error-expense-category"),
    amount: document.getElementById("error-expense-amount"),
  };

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
      fieldRefs[key].addEventListener("input", () => clearFieldError(key));
      fieldRefs[key].addEventListener("change", () => clearFieldError(key));
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
    const button = event.target.closest("button[data-action='delete']");
    if (!button) {
      return;
    }

    const id = button.dataset.id;
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
      date: dateInput.value.trim(),
      title: titleInput.value.trim(),
      category: categoryInput.value.trim(),
      amount: amountInput.value.trim(),
      notes: notesInput.value.trim(),
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

      errorEl.textContent = message;

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
    if (!fieldRefs[key] || !errorRefs[key]) {
      return;
    }

    fieldRefs[key].classList.remove("is-invalid");
    fieldRefs[key].removeAttribute("aria-invalid");
    errorRefs[key].textContent = "";
  }

  function focusFirstInvalidField(errors) {
    const firstKey = ["date", "title", "category", "amount"].find((key) => errors[key]);
    if (firstKey) {
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
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

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
        deleteButton.className = "btn-delete";
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

    totalSpentEl.textContent = currencyFormatter.format(total);
    totalCountEl.textContent = numberFormatter.format(count);
    averageEl.textContent = currencyFormatter.format(average);
    topCategoryEl.textContent = topCategoryEntry ? topCategoryEntry[0] : "-";
  }

  function renderCategoryChart() {
    if (typeof Chart === "undefined") {
      chartEmpty.hidden = false;
      chartEmpty.textContent = "Chart library not loaded.";
      return;
    }

    const categoryTotals = getCategoryTotals();
    const labels = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    if (!labels.length) {
      chartEmpty.hidden = false;
      if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
      }
      return;
    }

    chartEmpty.hidden = true;

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

    categoryChart = new Chart(chartCanvas.getContext("2d"), {
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
    if (!dateInput.value) {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      dateInput.value = `${year}-${month}-${day}`;
    }
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((entry) => ({
          id: String(entry.id || generateId()),
          date: String(entry.date || ""),
          title: String(entry.title || ""),
          category: String(entry.category || "Other"),
          amount: Number(entry.amount) || 0,
          notes: String(entry.notes || ""),
          createdAt: Number(entry.createdAt) || Date.now(),
        }))
        .filter((entry) => entry.amount > 0 && entry.date && entry.title);
    } catch (_error) {
      return [];
    }
  }

  function persistEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
})();
