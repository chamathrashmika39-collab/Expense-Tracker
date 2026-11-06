const STORAGE_KEY = "personalExpenseTransactions";

let transactions = loadTransactions();

// DOM references
const form = document.getElementById("transactionForm");
const typeEl = document.getElementById("type");
const descEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const clearBtn = document.getElementById("clearBtn");
const filterEl = document.getElementById("filter");
const searchEl = document.getElementById("search");
const tbody = document.getElementById("transactionBody");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("balance");

// ---------- Storage ----------
function loadTransactions() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    alert("Could not save data to localStorage.");
  }
}

// ---------- Helpers ----------
function todayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Validation ----------
function setError(input, errorId, message) {
  document.getElementById(errorId).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function validateForm() {
  let valid = true;

  const description = descEl.value.trim();
  const amount = parseFloat(amountEl.value);

  if (!description) {
    setError(descEl, "descriptionError", "Description is required.");
    valid = false;
  } else {
    setError(descEl, "descriptionError", "");
  }

  if (amountEl.value === "" || isNaN(amount)) {
    setError(amountEl, "amountError", "Amount is required.");
    valid = false;
  } else if (amount <= 0) {
    setError(amountEl, "amountError", "Amount must be greater than zero.");
    valid = false;
  } else {
    setError(amountEl, "amountError", "");
  }

  if (!categoryEl.value) {
    setError(categoryEl, "categoryError", "Please select a category.");
    valid = false;
  } else {
    setError(categoryEl, "categoryError", "");
  }

  if (!dateEl.value) {
    setError(dateEl, "dateError", "Date is required.");
    valid = false;
  } else {
    setError(dateEl, "dateError", "");
  }

  return valid;
}

// ---------- Core features ----------
function addTransaction(e) {
  e.preventDefault();
  if (!validateForm()) return;

  transactions.push({
    id: Date.now() + Math.random(),
    type: typeEl.value,
    description: descEl.value.trim(),
    amount: parseFloat(amountEl.value),
    category: categoryEl.value,
    date: dateEl.value
  });

  saveTransactions();
  render();
  resetForm();
  alert("Transaction added successfully!");
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
}

function resetForm() {
  form.reset();
  dateEl.value = todayString();
  [
    [descEl, "descriptionError"],
    [amountEl, "amountError"],
    [categoryEl, "categoryError"],
    [dateEl, "dateError"]
  ].forEach(([el, err]) => setError(el, err, ""));
}

function calculateTotals() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

function updateSummary() {
  const { income, expenses, balance } = calculateTotals();
  totalIncomeEl.textContent = formatLKR(income);
  totalExpensesEl.textContent = formatLKR(expenses);
  balanceEl.textContent = formatLKR(balance);
  balanceEl.classList.toggle("negative", balance < 0);
}

function getVisibleTransactions() {
  const filter = filterEl.value;
  const query = searchEl.value.trim().toLowerCase();

  return transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

function renderTable() {
  const visible = getVisibleTransactions();
  tbody.innerHTML = "";

  if (visible.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
    return;
  }

  visible.forEach(t => {
    const sign = t.type === "income" ? "+" : "\u2212";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(t.date)}</td>
      <td>${escapeHTML(t.description)}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td>${escapeHTML(t.category)}</td>
      <td class="amount ${t.type}">${sign} ${formatLKR(t.amount)}</td>
      <td><button class="btn btn-danger" type="button">Delete</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => deleteTransaction(t.id));
    tbody.appendChild(tr);
  });
}

function render() {
  updateSummary();
  renderTable();
}

// ---------- Events ----------
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterEl.addEventListener("change", renderTable);
searchEl.addEventListener("input", renderTable);

// ---------- Init ----------
dateEl.value = todayString();
render();