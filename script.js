let editingReceiptNo = null;

window.onload = function(){
  generateReceiptNumber();
  loadReceipts();
};

function generateReceiptNumber(){

  let lastNumber = localStorage.getItem("lastReceiptNumber") || 0;

  lastNumber++;

  localStorage.setItem("lastReceiptNumber", lastNumber);

  let now = new Date();

  let year = now.getFullYear().toString().slice(-2);
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");

  let serial = String(lastNumber).padStart(3, "0");

  let receiptNo = `PP${year}${month}${day}-${serial}`;

  document.getElementById("receiptNo").value = receiptNo;
  document.getElementById("rNo").innerText = receiptNo;
}
function generateReceipt(){
  let receiptNo = document.getElementById("receiptNo").value;
  let customerName = document.getElementById("customerName").value;
  let phone = document.getElementById("phone").value;
  let product = document.getElementById("product").value;
  let qty = document.getElementById("qty").value;
  let total = Number(document.getElementById("total").value) || 0;
  let paid = Number(document.getElementById("paid").value) || 0;
  let status = document.getElementById("status").value;

  let balance = total - paid;

  document.getElementById("rNo").innerText = receiptNo;
  document.getElementById("rName").innerText = customerName || "-";
  document.getElementById("rPhone").innerText = phone || "-";
  document.getElementById("rProduct").innerText = product || "-";
  document.getElementById("rQty").innerText = qty || "-";
  document.getElementById("rTotal").innerText = "₹" + total;
  document.getElementById("rPaid").innerText = "₹" + paid;
  document.getElementById("rBalance").innerText = "₹" + balance;
  document.getElementById("rStatus").innerText = status;
}

function saveReceipt(){
  generateReceipt();

  let receipt = getReceiptData();

  if(receipt.customer === "" || receipt.phone === "" || receipt.product === ""){
    alert("Please fill customer name, phone number and product details.");
    return;
  }

  let receipts = getReceipts();

  let duplicate = receipts.some(function(item){
    return item.receiptNo === receipt.receiptNo;
  });

  if(duplicate){
    alert("This receipt number already exists. Please refresh or generate another receipt.");
    return;
  }

  receipts.push(receipt);
  localStorage.setItem("receipts", JSON.stringify(receipts));

  loadReceipts();
  clearForm();

  alert("Receipt saved successfully!");
}

function getReceiptData(){
  let total = Number(document.getElementById("total").value) || 0;
  let paid = Number(document.getElementById("paid").value) || 0;
  let balance = total - paid;

  return {
    receiptNo: document.getElementById("receiptNo").value,
    date: new Date().toLocaleDateString("en-IN"),
    customer: document.getElementById("customerName").value,
    phone: document.getElementById("phone").value,
    product: document.getElementById("product").value,
    qty: document.getElementById("qty").value || "1",
    total: "₹" + total,
    paid: "₹" + paid,
    balance: "₹" + balance,
    status: document.getElementById("status").value
  };
}

function getReceipts(){
  return JSON.parse(localStorage.getItem("receipts")) || [];
}

function loadReceipts(){
  let receipts = getReceipts();

  let searchInput = document.getElementById("searchInput");
  let statusFilter = document.getElementById("statusFilter");

  let searchValue = searchInput ? searchInput.value.toLowerCase() : "";
  let selectedStatus = statusFilter ? statusFilter.value : "All";

  let filteredReceipts = receipts.filter(function(receipt){
    let matchesSearch =
      receipt.receiptNo.toLowerCase().includes(searchValue) ||
      receipt.customer.toLowerCase().includes(searchValue) ||
      receipt.phone.toLowerCase().includes(searchValue) ||
      receipt.product.toLowerCase().includes(searchValue);

    let matchesStatus =
      selectedStatus === "All" || receipt.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  let table = document.getElementById("receiptTable");
  table.innerHTML = "";

  filteredReceipts.forEach(function(receipt){
    table.innerHTML += `
      <tr>
        <td>${receipt.receiptNo}</td>
        <td>${receipt.date}</td>
        <td>${receipt.customer}</td>
        <td>${receipt.phone}</td>
        <td>${receipt.product}</td>
        <td>${receipt.qty}</td>
        <td>${receipt.total}</td>
        <td>${receipt.paid}</td>
        <td>${receipt.balance}</td>
        <td><span class="status-badge">${receipt.status}</span></td>
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

function editReceipt(receiptNo){
  let receipts = getReceipts();

  let receipt = receipts.find(function(item){
    return item.receiptNo === receiptNo;
  });

  if(!receipt){
    alert("Receipt not found.");
    return;
  }

  editingReceiptNo = receiptNo;

  document.getElementById("receiptNo").value = receipt.receiptNo;
  document.getElementById("customerName").value = receipt.customer;
  document.getElementById("phone").value = receipt.phone;
  document.getElementById("product").value = receipt.product;
  document.getElementById("qty").value = receipt.qty;
  document.getElementById("total").value = removeRupee(receipt.total);
  document.getElementById("paid").value = removeRupee(receipt.paid);
  document.getElementById("status").value = receipt.status;

  generateReceipt();

  document.getElementById("saveBtn").classList.add("hidden");
  document.getElementById("updateBtn").classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function updateReceipt(){
  if(!editingReceiptNo){
    alert("No receipt selected for editing.");
    return;
  }

  generateReceipt();

  let updatedReceipt = getReceiptData();

  let receipts = getReceipts();

  receipts = receipts.map(function(receipt){
    if(receipt.receiptNo === editingReceiptNo){
      return updatedReceipt;
    }
    return receipt;
  });

  localStorage.setItem("receipts", JSON.stringify(receipts));

  editingReceiptNo = null;

  document.getElementById("saveBtn").classList.remove("hidden");
  document.getElementById("updateBtn").classList.add("hidden");

  loadReceipts();
  clearForm();

  alert("Receipt updated successfully!");
}

function deleteReceipt(receiptNo){
  let confirmDelete = confirm("Are you sure you want to delete this receipt?");

  if(!confirmDelete){
    return;
  }

  let receipts = getReceipts();

  receipts = receipts.filter(function(receipt){
    return receipt.receiptNo !== receiptNo;
  });

  localStorage.setItem("receipts", JSON.stringify(receipts));

  loadReceipts();

  alert("Receipt deleted successfully!");
}

function exportToExcel(){
  let receipts = getReceipts();

  if(receipts.length === 0){
    alert("No receipts to export.");
    return;
  }

  let csv = "Receipt No,Date,Customer,Phone,Product,Quantity,Total,Paid,Balance,Status\n";

  receipts.forEach(function(r){
    csv += `"${r.receiptNo}","${r.date}","${r.customer}","${r.phone}","${r.product}","${r.qty}","${r.total}","${r.paid}","${r.balance}","${r.status}"\n`;
  });

  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "Pixel-Paper-Receipts.csv";
  link.click();
}

function sendWhatsApp(){
  generateReceipt();

  let receipt = getReceiptData();

  if(receipt.phone === ""){
    alert("Please enter customer phone number.");
    return;
  }

  openWhatsApp(receipt);
}

function sendSavedWhatsApp(receiptNo){
  let receipts = getReceipts();

  let receipt = receipts.find(function(item){
    return item.receiptNo === receiptNo;
  });

  if(!receipt){
    alert("Receipt not found.");
    return;
  }

  openWhatsApp(receipt);
}

function openWhatsApp(receipt){
  let phone = receipt.phone.replace(/\D/g,"");

  if(phone.length === 10){
    phone = "91" + phone;
  }

  let message =
`Pixel & Paper Receipt

Receipt No: ${receipt.receiptNo}
Customer: ${receipt.customer}
Product: ${receipt.product}
Quantity: ${receipt.qty}
Total: ${receipt.total}
Paid: ${receipt.paid}
Balance: ${receipt.balance}
Status: ${receipt.status}

Thank you for supporting handmade creativity ♡`;

  let encodedMessage = encodeURIComponent(message);

  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
}

function clearForm(){
  editingReceiptNo = null;

  document.getElementById("customerName").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("product").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("total").value = "";
  document.getElementById("paid").value = "";
  document.getElementById("status").value = "Designing";

  document.getElementById("rName").innerText = "-";
  document.getElementById("rPhone").innerText = "-";
  document.getElementById("rProduct").innerText = "-";
  document.getElementById("rQty").innerText = "-";
  document.getElementById("rTotal").innerText = "₹0";
  document.getElementById("rPaid").innerText = "₹0";
  document.getElementById("rBalance").innerText = "₹0";
  document.getElementById("rStatus").innerText = "-";

  document.getElementById("saveBtn").classList.remove("hidden");
  document.getElementById("updateBtn").classList.add("hidden");

  generateReceiptNumber();
}

function removeRupee(value){
  return String(value).replace("₹", "");
}