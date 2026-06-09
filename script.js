const STORAGE_KEY = "pixelPaperOrdersV1";

const $ = (id) => document.getElementById(id);
let orders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const form = $("orderForm");
const fields = {
  editId: $("editId"), receiptNo: $("receiptNo"), customerName: $("customerName"), phone: $("phone"),
  product: $("product"), quantity: $("quantity"), unit: $("unit"), priceEach: $("priceEach"),
  totalAmount: $("totalAmount"), advancePaid: $("advancePaid"), paymentStatus: $("paymentStatus"),
  orderStatus: $("orderStatus"), notes: $("notes")
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function todayCode() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`; // PPDDMMYY-001
}

function todayDisplay() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getNextReceiptNo() {
  const code = todayCode();
  const todaysOrders = orders.filter(o => o.receiptNo.startsWith(`PP${code}-`));
  const maxSerial = todaysOrders.reduce((max, o) => {
    const serial = Number(o.receiptNo.split("-")[1] || 0);
    return Math.max(max, serial);
  }, 0);
  return `PP${code}-${String(maxSerial + 1).padStart(3, "0")}`;
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function calcBalance() {
  const total = Number(fields.totalAmount.value || 0);
  const paid = Number(fields.advancePaid.value || 0);
  return Math.max(total - paid, 0);
}

function syncPaymentStatus() {
  const total = Number(fields.totalAmount.value || 0);
  const paid = Number(fields.advancePaid.value || 0);
  if (total <= 0 || paid <= 0) fields.paymentStatus.value = "Unpaid";
  else if (paid >= total) fields.paymentStatus.value = "Paid";
  else fields.paymentStatus.value = "Partially Paid";
}

function updateTotalFromPrice() {
  const qty = Number(fields.quantity.value || 0);
  const price = Number(fields.priceEach.value || 0);
  if (qty > 0 && price >= 0 && document.activeElement !== fields.totalAmount) {
    fields.totalAmount.value = (qty * price).toFixed(2).replace(/\.00$/, "");
  }
  updatePreview();
}

function updatePreview() {
  syncPaymentStatus();
  const balance = calcBalance();
  $("balanceText").textContent = money(balance);
  $("rReceiptNo").textContent = fields.receiptNo.value || getNextReceiptNo();
  $("rCustomer").textContent = fields.customerName.value || "-";
  $("rPhone").textContent = fields.phone.value || "-";
  $("rProduct").textContent = fields.product.value || "-";
  $("rQty").textContent = `${fields.quantity.value || 0} ${fields.unit.value || ""}`;
  $("rTotal").textContent = money(fields.totalAmount.value);
  $("rBalance").textContent = money(balance);
  $("rPayment").textContent = fields.paymentStatus.value;
  $("rOrder").textContent = fields.orderStatus.value;
  $("rNotes").textContent = fields.notes.value || "-";
}

function clearForm() {
  form.reset();
  fields.editId.value = "";
  fields.quantity.value = 1;
  fields.advancePaid.value = 0;
  fields.receiptNo.value = getNextReceiptNo();
  $("formTitle").textContent = "Create Order / Receipt";
  $("saveBtn").textContent = "Save Order";
  updatePreview();
}

function collectFormData() {
  const editing = Boolean(fields.editId.value);
  const receiptNo = editing ? fields.receiptNo.value : getNextReceiptNo();
  return {
    id: editing ? fields.editId.value : String(Date.now()),
    receiptNo,
    date: editing ? (orders.find(o => o.id === fields.editId.value)?.date || todayDisplay()) : todayDisplay(),
    customerName: fields.customerName.value.trim(),
    phone: fields.phone.value.trim(),
    product: fields.product.value.trim(),
    quantity: Number(fields.quantity.value || 0),
    unit: fields.unit.value,
    priceEach: Number(fields.priceEach.value || 0),
    totalAmount: Number(fields.totalAmount.value || 0),
    advancePaid: Number(fields.advancePaid.value || 0),
    balance: calcBalance(),
    paymentStatus: fields.paymentStatus.value,
    orderStatus: fields.orderStatus.value,
    notes: fields.notes.value.trim()
  };
}

function renderOrders() {
  const search = $("searchInput").value.toLowerCase();
  const paymentFilter = $("paymentFilter").value;
  const orderFilter = $("orderFilter").value;
  const tbody = $("ordersTable");
  tbody.innerHTML = "";

  const filtered = orders.filter(o => {
    const matchesSearch = [o.receiptNo, o.customerName, o.phone, o.product, o.notes].join(" ").toLowerCase().includes(search);
    const matchesPayment = paymentFilter === "All" || o.paymentStatus === paymentFilter;
    const matchesOrder = orderFilter === "All" || o.orderStatus === orderFilter;
    return matchesSearch && matchesPayment && matchesOrder;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="12">No saved orders found.</td></tr>`;
  }

  filtered.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.receiptNo}</td>
      <td>${o.date}</td>
      <td>${o.customerName}</td>
      <td>${o.phone}</td>
      <td>${o.product}</td>
      <td>${o.quantity} ${o.unit}</td>
      <td>${money(o.totalAmount)}</td>
      <td>${money(o.balance)}</td>
      <td><span class="status-pill">${o.paymentStatus}</span></td>
      <td><span class="status-pill">${o.orderStatus}</span></td>
      <td>${o.notes || "-"}</td>
      <td>
        <button class="mini-btn primary-btn" onclick="editOrder('${o.id}')">Edit</button>
        <button class="mini-btn ghost-btn" onclick="loadReceipt('${o.id}')">Receipt</button>
        <button class="mini-btn whatsapp-btn" onclick="sendWhatsApp('${o.id}')">WhatsApp</button>
        <button class="mini-btn danger-btn" onclick="deleteOrder('${o.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  updateDashboard();
}

function updateDashboard() {
  const total = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const paid = orders.reduce((sum, o) => sum + Number(o.advancePaid || 0), 0);
  const pending = orders.reduce((sum, o) => sum + Number(o.balance || 0), 0);
  const percent = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  $("dashTotal").textContent = money(total);
  $("dashPaid").textContent = money(paid);
  $("dashPending").textContent = money(pending);
  $("paidPercent").textContent = `${percent}%`;
  $("paidCircle").style.background = `conic-gradient(var(--forest) ${percent * 3.6}deg, var(--taupe) 0deg)`;
}

function editOrder(id) {
  const o = orders.find(order => order.id === id);
  if (!o) return;
  fields.editId.value = o.id;
  fields.receiptNo.value = o.receiptNo;
  fields.customerName.value = o.customerName;
  fields.phone.value = o.phone;
  fields.product.value = o.product;
  fields.quantity.value = o.quantity;
  fields.unit.value = o.unit;
  fields.priceEach.value = o.priceEach || "";
  fields.totalAmount.value = o.totalAmount;
  fields.advancePaid.value = o.advancePaid;
  fields.paymentStatus.value = o.paymentStatus;
  fields.orderStatus.value = o.orderStatus;
  fields.notes.value = o.notes;
  $("formTitle").textContent = "Edit Existing Order";
  $("saveBtn").textContent = "Update Order";
  updatePreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadReceipt(id) {
  const o = orders.find(order => order.id === id);
  if (!o) return;
  $("rReceiptNo").textContent = o.receiptNo;
  $("rCustomer").textContent = o.customerName;
  $("rPhone").textContent = o.phone;
  $("rProduct").textContent = o.product;
  $("rQty").textContent = `${o.quantity} ${o.unit}`;
  $("rTotal").textContent = money(o.totalAmount);
  $("rBalance").textContent = money(o.balance);
  $("rPayment").textContent = o.paymentStatus;
  $("rOrder").textContent = o.orderStatus;
  $("rNotes").textContent = o.notes || "-";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders();
  clearForm();
  renderOrders();
}

function whatsappText(o) {
  return `Pixel & Paper Receipt\n\nReceipt No: ${o.receiptNo}\nCustomer: ${o.customerName}\nPhone: ${o.phone}\nProduct: ${o.product}\nQuantity: ${o.quantity} ${o.unit}\nTotal: ${money(o.totalAmount)}\nBalance: ${money(o.balance)}\nPayment Status: ${o.paymentStatus}\nOrder Status: ${o.orderStatus}\nNotes: ${o.notes || "-"}\n\nThank you for supporting handmade creativity ♡`;
}

function cleanPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function sendWhatsApp(id) {
  const o = orders.find(order => order.id === id) || collectFormData();
  const phone = cleanPhone(o.phone);
  if (!phone) return alert("Please enter customer phone number.");
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText(o))}`;
  window.open(url, "_blank");
}

function printReceipt() {
  window.print();
}

function downloadExcel() {
  const rows = [["Receipt No", "Date", "Customer", "Phone", "Product", "Quantity", "Unit", "Per Item Price", "Total", "Amount Paid", "Balance", "Payment", "Status", "Notes"]];
  orders.forEach(o => rows.push([o.receiptNo, o.date, o.customerName, o.phone, o.product, o.quantity, o.unit, o.priceEach, o.totalAmount, o.advancePaid, o.balance, o.paymentStatus, o.orderStatus, o.notes]));
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${rows.map(row => `<tr>${row.map(cell => `<td>${String(cell ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Pixel-Paper-Orders-${todayCode()}.xls`;
  link.click();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  updatePreview();
  const data = collectFormData();
  if (!data.customerName || !data.phone || !data.product) return alert("Please fill customer name, phone, and product details.");
  if (data.totalAmount <= 0) return alert("Please enter total amount or per item price.");

  const existingIndex = orders.findIndex(o => o.id === data.id);
  if (existingIndex >= 0) orders[existingIndex] = data;
  else orders.push(data);

  saveOrders();
  renderOrders();
  loadReceipt(data.id);
  clearForm();
  alert(existingIndex >= 0 ? "Order updated successfully." : "Order saved successfully.");
});

[fields.customerName, fields.phone, fields.product, fields.quantity, fields.unit, fields.priceEach, fields.totalAmount, fields.advancePaid, fields.orderStatus, fields.notes].forEach(input => {
  input.addEventListener("input", () => {
    if (input === fields.priceEach || input === fields.quantity) updateTotalFromPrice();
    else updatePreview();
  });
});

fields.totalAmount.addEventListener("input", updatePreview);
$("resetBtn").addEventListener("click", clearForm);
$("printReceiptBtn").addEventListener("click", printReceipt);
$("whatsappPreviewBtn").addEventListener("click", () => sendWhatsApp(fields.editId.value));
$("downloadExcelBtn").addEventListener("click", downloadExcel);
$("searchInput").addEventListener("input", renderOrders);
$("paymentFilter").addEventListener("change", renderOrders);
$("orderFilter").addEventListener("change", renderOrders);

clearForm();
renderOrders();
