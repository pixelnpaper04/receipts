let editingReceiptNo = null;

window.onload = function () {
    generateReceiptNumber();
    loadReceipts();
};

function generateReceiptNumber() {
    let lastNumber = parseInt(localStorage.getItem("lastReceiptNumber")) || 0;
    let nextNumber = lastNumber + 1;

    let now = new Date();
    let year = now.getFullYear().toString().slice(-2);
    let month = String(now.getMonth() + 1).padStart(2, "0");
    let day = String(now.getDate()).padStart(2, "0");
    let serial = String(nextNumber).padStart(3, "0");

    let receiptNo = `PP${year}${month}${day}-${serial}`;

    document.getElementById("receiptNo").value = receiptNo;
    document.getElementById("rNo").innerText = receiptNo;
}

function calculatePayment(total, paid, paymentStatus) {
    if (paymentStatus === "Paid") {
        paid = total;
    }

    if (paymentStatus === "Unpaid") {
        paid = 0;
    }

    let balance = total - paid;

    if (balance < 0) {
        balance = 0;
    }

    return {
        paid: paid,
        balance: balance
    };
}

function generateReceipt() {
    let receiptNo = document.getElementById("receiptNo").value;
    let customerName = document.getElementById("customerName").value;
    let phone = document.getElementById("phone").value;
    let product = document.getElementById("product").value;
    let qty = document.getElementById("qty").value || "1";
    let unit = document.getElementById("unit").value;

    let total = Number(document.getElementById("total").value) || 0;
    let paid = Number(document.getElementById("paid").value) || 0;
    let paymentStatus = document.getElementById("paymentStatus").value;

    let payment = calculatePayment(total, paid, paymentStatus);

    let status = document.getElementById("status").value;
    let notes = document.getElementById("notes").value;

    document.getElementById("rNo").innerText = receiptNo;
    document.getElementById("rName").innerText = customerName || "-";
    document.getElementById("rPhone").innerText = phone || "-";
    document.getElementById("rProduct").innerText = product || "-";
    document.getElementById("rQty").innerText = qty + " " + unit;
    document.getElementById("rTotal").innerText = "₹" + total;
    document.getElementById("rPaid").innerText = "₹" + payment.paid;
    document.getElementById("rBalance").innerText = "₹" + payment.balance;
    document.getElementById("rPaymentStatus").innerText = paymentStatus;
    document.getElementById("rStatus").innerText = status;
    document.getElementById("rNotes").innerText = notes || "-";
}

function getReceipts() {
    return JSON.parse(localStorage.getItem("receipts")) || [];
}

function getReceiptData() {
    let total = Number(document.getElementById("total").value) || 0;
    let paid = Number(document.getElementById("paid").value) || 0;
    let paymentStatus = document.getElementById("paymentStatus").value;

    let payment = calculatePayment(total, paid, paymentStatus);

    return {
        receiptNo: document.getElementById("receiptNo").value,
        date: new Date().toLocaleDateString("en-IN"),
        customer: document.getElementById("customerName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        product: document.getElementById("product").value.trim(),
        qty: document.getElementById("qty").value || "1",
        unit: document.getElementById("unit").value,
        total: "₹" + total,
        paid: "₹" + payment.paid,
        balance: "₹" + payment.balance,
        paymentStatus: paymentStatus,
        status: document.getElementById("status").value,
        notes: document.getElementById("notes").value.trim()
    };
}

function saveReceipt() {
    generateReceipt();

    let receipt = getReceiptData();

    if (receipt.customer === "" || receipt.phone === "" || receipt.product === "") {
        alert("Please fill customer name, phone number and product details.");
        return;
    }

    let receipts = getReceipts();

    let duplicate = receipts.some(function (r) {
        return r.receiptNo === receipt.receiptNo;
    });

    if (duplicate) {
        alert("This receipt number already exists.");
        return;
    }

    receipts.push(receipt);
    localStorage.setItem("receipts", JSON.stringify(receipts));

    let lastNumber = parseInt(localStorage.getItem("lastReceiptNumber")) || 0;
    localStorage.setItem("lastReceiptNumber", lastNumber + 1);

    loadReceipts();
    clearForm();

    alert("Receipt saved successfully!");
}

function loadReceipts() {
    let receipts = getReceipts();

    let searchInput = document.getElementById("searchInput");
    let statusFilter = document.getElementById("statusFilter");

    let search = searchInput ? searchInput.value.toLowerCase() : "";
    let filter = statusFilter ? statusFilter.value : "All";

    let table = document.getElementById("receiptTable");
    table.innerHTML = "";

    receipts.forEach(function (receipt) {
        let matchSearch =
            receipt.receiptNo.toLowerCase().includes(search) ||
            receipt.customer.toLowerCase().includes(search) ||
            receipt.phone.toLowerCase().includes(search) ||
            receipt.product.toLowerCase().includes(search) ||
            (receipt.notes || "").toLowerCase().includes(search);

        let matchStatus = filter === "All" || receipt.status === filter;

        if (!matchSearch || !matchStatus) return;

        table.innerHTML += `
        <tr>
            <td>${receipt.receiptNo}</td>
            <td>${receipt.date}</td>
            <td>${receipt.customer}</td>
            <td>${receipt.phone}</td>
            <td>${receipt.product}</td>
            <td>${receipt.qty}</td>
            <td>${receipt.unit}</td>
            <td>${receipt.total}</td>
            <td>${receipt.paid}</td>
            <td>${receipt.balance}</td>
            <td><span class="status-badge">${receipt.paymentStatus || "-"}</span></td>
            <td><span class="status-badge">${receipt.status}</span></td>
            <td>${receipt.notes || "-"}</td>
            <td>
                <div class="actions">
                    <button class="action-btn edit-btn" onclick="editReceipt('${receipt.receiptNo}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteReceipt('${receipt.receiptNo}')">Delete</button>
                    <button class="action-btn whatsapp-btn" onclick="sendSavedWhatsApp('${receipt.receiptNo}')">WhatsApp</button>
                </div>
            </td>
        </tr>
        `;
    });
}

function editReceipt(receiptNo) {
    let receipt = getReceipts().find(function (r) {
        return r.receiptNo === receiptNo;
    });

    if (!receipt) {
        alert("Receipt not found.");
        return;
    }

    editingReceiptNo = receiptNo;

    document.getElementById("receiptNo").value = receipt.receiptNo;
    document.getElementById("customerName").value = receipt.customer;
    document.getElementById("phone").value = receipt.phone;
    document.getElementById("product").value = receipt.product;
    document.getElementById("qty").value = receipt.qty;
    document.getElementById("unit").value = receipt.unit || "Nos";
    document.getElementById("total").value = receipt.total.replace("₹", "");
    document.getElementById("paid").value = receipt.paid.replace("₹", "");
    document.getElementById("paymentStatus").value = receipt.paymentStatus || "Unpaid";
    document.getElementById("status").value = receipt.status;
    document.getElementById("notes").value = receipt.notes || "";

    generateReceipt();

    document.getElementById("saveBtn").classList.add("hidden");
    document.getElementById("updateBtn").classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateReceipt() {
    if (!editingReceiptNo) {
        alert("No receipt selected for editing.");
        return;
    }

    generateReceipt();

    let updatedReceipt = getReceiptData();

    let receipts = getReceipts().map(function (receipt) {
        return receipt.receiptNo === editingReceiptNo ? updatedReceipt : receipt;
    });

    localStorage.setItem("receipts", JSON.stringify(receipts));

    editingReceiptNo = null;

    document.getElementById("saveBtn").classList.remove("hidden");
    document.getElementById("updateBtn").classList.add("hidden");

    loadReceipts();
    clearForm();

    alert("Receipt updated successfully!");
}

function deleteReceipt(receiptNo) {
    if (!confirm("Delete this receipt?")) return;

    let receipts = getReceipts().filter(function (receipt) {
        return receipt.receiptNo !== receiptNo;
    });

    localStorage.setItem("receipts", JSON.stringify(receipts));
    loadReceipts();

    alert("Receipt deleted successfully!");
}

function exportToExcel() {
    let receipts = getReceipts();

    if (receipts.length === 0) {
        alert("No receipts available.");
        return;
    }

    let csv = "Receipt No,Date,Customer,Phone,Product,Quantity,Unit,Total,Paid,Balance,Payment Status,Order Status,Notes\n";

    receipts.forEach(function (r) {
        csv += `"${r.receiptNo}","${r.date}","${r.customer}","${r.phone}","${r.product}","${r.qty}","${r.unit}","${r.total}","${r.paid}","${r.balance}","${r.paymentStatus || ""}","${r.status}","${r.notes || ""}"\n`;
    });

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "Pixel-Paper-Receipts.csv";
    link.click();
}

function sendWhatsApp() {
    generateReceipt();

    let receipt = getReceiptData();

    if (receipt.phone === "") {
        alert("Please enter customer phone number.");
        return;
    }

    openWhatsApp(receipt);
}

function sendSavedWhatsApp(receiptNo) {
    let receipt = getReceipts().find(function (r) {
        return r.receiptNo === receiptNo;
    });

    if (!receipt) {
        alert("Receipt not found.");
        return;
    }

    openWhatsApp(receipt);
}

function openWhatsApp(receipt) {
    let phone = receipt.phone.replace(/\D/g, "");

    if (phone.length === 10) {
        phone = "91" + phone;
    }

    let message = encodeURIComponent(
`Pixel & Paper Receipt

Receipt No: ${receipt.receiptNo}
Customer: ${receipt.customer}
Product: ${receipt.product}
Quantity: ${receipt.qty} ${receipt.unit}
Total: ${receipt.total}
Paid: ${receipt.paid}
Balance: ${receipt.balance}
Payment Status: ${receipt.paymentStatus}
Order Status: ${receipt.status}
Notes: ${receipt.notes || "-"}

Thank you for supporting handmade creativity ♡`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function clearForm() {
    editingReceiptNo = null;

    document.getElementById("customerName").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("product").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("unit").value = "Nos";
    document.getElementById("total").value = "";
    document.getElementById("paid").value = "";
    document.getElementById("paymentStatus").value = "Unpaid";
    document.getElementById("status").value = "Designing";
    document.getElementById("notes").value = "";

    document.getElementById("saveBtn").classList.remove("hidden");
    document.getElementById("updateBtn").classList.add("hidden");

    document.getElementById("rName").innerText = "-";
    document.getElementById("rPhone").innerText = "-";
    document.getElementById("rProduct").innerText = "-";
    document.getElementById("rQty").innerText = "-";
    document.getElementById("rTotal").innerText = "₹0";
    document.getElementById("rPaid").innerText = "₹0";
    document.getElementById("rBalance").innerText = "₹0";
    document.getElementById("rPaymentStatus").innerText = "-";
    document.getElementById("rStatus").innerText = "-";
    document.getElementById("rNotes").innerText = "-";

    generateReceiptNumber();
}