// ==========================================
// AEGIS - AI FINANCIAL SECURITY CORE LOGIC
// ==========================================

const AegisState = {
    currentPage: "dashboard",
    transactions: [
        {
            id: "TXN-1092",
            merchant: "Amazon India",
            icon: "A",
            category: "Shopping",
            time: "Today · 10:42 AM",
            amount: 2400,
            score: 12,
            level: "LOW",
            status: "SAFE"
        }
    ],
    expenses: [
        { id: "EXP-1", name: "AWS Cloud Hosting", category: "Infrastructure", amount: 14200, date: "2026-08-28" },
        { id: "EXP-2", name: "API Gateway Services", category: "Software", amount: 8500, date: "2026-08-29" },
        { id: "EXP-3", name: "Office Supplies", category: "Operations", amount: 15740, date: "2026-08-30" }
    ],
    latestAnalysis: null
};

let riskChartInstance = null;
let trendChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initExpenseTracker();
    renderDashboardStats();
    renderTransactionTable();
});

function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-item[data-page]");
    const actionButtons = document.querySelectorAll("[data-page-action]");

    function switchPage(pageId) {
        if (!pageId) return;
        AegisState.currentPage = pageId;

        document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
        navButtons.forEach(btn => btn.classList.remove("active"));

        const targetPage = document.getElementById(`${pageId}Page`);
        if (targetPage) targetPage.classList.add("active-page");

        const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        if (activeNav) {
            activeNav.classList.add("active");
            const labelSpan = activeNav.querySelector("span:not(.nav-icon):not(.nav-count)");
            const pageTitle = document.getElementById("pageTitle");
            if (labelSpan && pageTitle) pageTitle.textContent = labelSpan.textContent.trim();
        }

        if (pageId === "analytics") {
            renderAnalyticsCharts();
        } else if (pageId === "reasoning") {
            renderReasoningBreakdown();
        } else if (pageId === "alerts") {
            renderFraudAlerts();
        } else if (pageId === "expenses") {
            renderExpenseTracker();
        }
    }

    navButtons.forEach(button => {
        button.addEventListener("click", () => switchPage(button.getAttribute("data-page")));
    });

    actionButtons.forEach(button => {
        button.addEventListener("click", () => switchPage(button.getAttribute("data-page-action")));
    });
}

function getFormData() {
    return {
        amount: Number(document.getElementById("amount").value) || 2000,
        usual_amount: Number(document.getElementById("usualAmount").value) || 1500,
        frequency: Number(document.getElementById("frequency").value) || 1,
        new_recipient: document.getElementById("newRecipient") ? document.getElementById("newRecipient").checked : false,
        unusual_location: document.getElementById("unusualLocation") ? document.getElementById("unusualLocation").checked : false,
        transaction_time: document.getElementById("transactionTime").value || "14:30"
    };
}

// ------------------------------------------
// EXPENSE TRACKER LOGIC
// ------------------------------------------
function initExpenseTracker() {
    const addBtn = document.getElementById("addExpenseButton");
    if (!addBtn) return;

    addBtn.onclick = () => {
        const name = prompt("Enter Expense Name:", "SaaS Subscription");
        if (!name) return;
        const amount = Number(prompt("Enter Amount (₹):", "2500"));
        if (!amount || isNaN(amount)) return;

        AegisState.expenses.unshift({
            id: `EXP-${Date.now()}`,
            name: name,
            category: "General",
            amount: amount,
            date: new Date().toISOString().split('T')[0]
        });

        renderExpenseTracker();
    };
}

function renderExpenseTracker() {
    const totalEl = document.getElementById("monthlyExpense");
    const container = document.getElementById("expensesPage");
    if (!container) return;

    const totalSum = AegisState.expenses.reduce((sum, item) => sum + item.amount, 0);
    if (totalEl) totalEl.textContent = `₹${totalSum.toLocaleString("en-IN")}`;

    let listCard = document.getElementById("expenseListCard");
    if (!listCard) {
        listCard = document.createElement("div");
        listCard.id = "expenseListCard";
        listCard.className = "card";
        listCard.style.marginTop = "20px";
        container.appendChild(listCard);
    }

    const header = `
        <div class="card-heading" style="margin-bottom: 16px;">
            <div>
                <span class="card-label">RECORDED ENTRIES</span>
                <h3>Expense History</h3>
            </div>
        </div>
        <div class="table-row table-heading">
            <span>NAME</span>
            <span>CATEGORY</span>
            <span>DATE</span>
            <span>AMOUNT</span>
            <span>ACTION</span>
        </div>`;

    const rows = AegisState.expenses.map(item => `
        <div class="table-row">
            <strong>${item.name}</strong>
            <span style="color: #94a3b8;">${item.category}</span>
            <span style="color: #64748b;">${item.date}</span>
            <strong style="color: #38bdf8;">₹${item.amount.toLocaleString("en-IN")}</strong>
            <button onclick="removeExpense('${item.id}')" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;">
                DELETE
            </button>
        </div>
    `).join("");

    listCard.innerHTML = header + rows;
}

function removeExpense(id) {
    AegisState.expenses = AegisState.expenses.filter(e => e.id !== id);
    renderExpenseTracker();
}

// ------------------------------------------
// RAZORPAY & ANALYSIS ENGINE LOGIC
// ------------------------------------------
function openRazorpayModal() {
    const formData = getFormData();
    const amountEl = document.getElementById("modalPayAmount");
    if (amountEl) {
        amountEl.textContent = `₹${formData.amount.toLocaleString("en-IN")}.00`;
    }
    const modal = document.getElementById("rzpCustomModal");
    if (modal) {
        modal.style.display = "flex";
    }
}

function closeRazorpayModal() {
    const modal = document.getElementById("rzpCustomModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function completeTestPayment(method) {
    closeRazorpayModal();
    const fakePaymentId = `pay_rzp_${Math.floor(100000000 + Math.random() * 900000000)}`;
    alert(`Razorpay Payment Successful!\nPayment ID: ${fakePaymentId}\nMethod: ${method}\n\nFeeding transaction telemetry into Aegis AI Risk Engine...`);
    runAegisAnalysis();
}

async function runAegisAnalysis() {
    const formData = getFormData();
    try {
        const response = await fetch("http://127.0.0.1:8000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json();
            AegisState.latestAnalysis = { input: formData, output: result };
            updateAnalyzeVerdictView(result);
            recordAnalyzedTransaction(formData, result);
            renderDashboardStats();
            renderTransactionTable();
            updateAlertBadge();
        }
    } catch (err) {
        alert("Could not connect to FastAPI backend server on port 8000.");
    }
}

function updateAnalyzeVerdictView(result) {
    document.getElementById("riskScore").textContent = result.risk_score;
    document.getElementById("riskLevel").textContent = result.risk_level;
    document.getElementById("riskBadge").textContent = result.risk_level;
    document.getElementById("riskBadge").className = `badge ${result.risk_level.toLowerCase()}`;
    document.getElementById("riskMessage").textContent = result.explanation;
    document.getElementById("riskMeterFill").style.width = `${result.risk_score}%`;
    document.getElementById("factorCount").textContent = result.risk_factors ? result.risk_factors.length : 0;

    const list = document.getElementById("riskFactors");
    if (list) {
        list.innerHTML = (!result.risk_factors || result.risk_factors.length === 0)
            ? '<div class="empty-factor">No suspicious signals detected.</div>'
            : result.risk_factors.map(f => `<div class="factor">${f}</div>`).join("");
    }

    // TRIGGER DYNAMIC 2FA STEP-UP MODAL IF HIGH RISK
    if (result.risk_level === "HIGH") {
        setTimeout(() => {
            document.getElementById("otpModal").style.display = "flex";
        }, 500);
    }
}

// ------------------------------------------
// 2FA STEP-UP MODAL HANDLERS
// ------------------------------------------
function verifyOTP() {
    const otp = document.getElementById("otpInput").value;
    if (otp === "123456" || otp === "1234") {
        alert("✅ OTP Verified Successfully! Override approval granted for transaction.");
        document.getElementById("otpModal").style.display = "none";
    } else {
        alert("❌ Invalid OTP! Aegis AI Security Engine has BLOCKED this transaction.");
    }
}

function cancelOTP() {
    document.getElementById("otpModal").style.display = "none";
    alert("🚫 Transaction BLOCKED and queued in Fraud Alerts center.");
}

// ------------------------------------------
// CSV AUDIT LOG EXPORTER
// ------------------------------------------
function exportAuditLogCSV() {
    if (!AegisState.transactions || AegisState.transactions.length === 0) {
        return alert("No transaction audit records available to export!");
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Merchant,Amount,RiskScore,RiskLevel,Status,Time\n";
    
    AegisState.transactions.forEach(t => {
        csvContent += `${t.id},${t.merchant},${t.amount},${t.score},${t.level},${t.status},"${t.time}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aegis_Security_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function recordAnalyzedTransaction(input, result) {
    AegisState.transactions.unshift({
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        merchant: input.new_recipient ? "New Recipient Txn" : "Standard Direct Merchant",
        icon: input.new_recipient ? "?" : "T",
        category: "Transfer",
        time: `Just Now · ${input.transaction_time}`,
        amount: input.amount,
        score: result.risk_score,
        level: result.risk_level,
        status: result.risk_level === "HIGH" ? "ALERT" : result.risk_level === "MEDIUM" ? "REVIEW" : "SAFE"
    });
}

function renderDashboardStats() {
    const totalEl = document.getElementById("totalTransactions");
    if (totalEl) totalEl.textContent = AegisState.transactions.length.toLocaleString();
}

function updateAlertBadge() {
    const badge = document.getElementById("alertBadgeCount");
    const flaggedCount = AegisState.transactions.filter(t => t.level === "HIGH" || t.level === "MEDIUM").length;
    if (badge) badge.textContent = flaggedCount;
}

function renderTransactionTable() {
    const tableContainer = document.querySelector(".transaction-table");
    if (!tableContainer) return;

    const header = `
        <div class="table-row table-heading">
            <span>TRANSACTION</span>
            <span>AMOUNT</span>
            <span>RISK</span>
            <span>SCORE</span>
            <span>STATUS</span>
        </div>`;

    const rows = AegisState.transactions.slice(0, 5).map(txn => `
        <div class="table-row">
            <div class="transaction-name">
                <div class="merchant-icon">${txn.icon}</div>
                <div>
                    <strong>${txn.merchant}</strong>
                    <small>${txn.time}</small>
                </div>
            </div>
            <span>₹${txn.amount.toLocaleString("en-IN")}</span>
            <span class="risk-pill ${txn.level.toLowerCase()}">${txn.level}</span>
            <strong>${txn.score}</strong>
            <span class="status-text">● ${txn.status}</span>
        </div>
    `).join("");

    tableContainer.innerHTML = header + rows;
}

function renderFraudAlerts() {
    const alertContainer = document.querySelector(".alert-list");
    if (!alertContainer) return;

    const flagged = AegisState.transactions.filter(t => t.level === "HIGH" || t.level === "MEDIUM");

    if (flagged.length === 0) {
        alertContainer.innerHTML = `<div style="padding: 24px; color: #94a3b8; text-align: center;">No active security threats flagged. System operating normally.</div>`;
        return;
    }

    alertContainer.innerHTML = flagged.map(txn => `
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid ${txn.level === 'HIGH' ? '#ef4444' : '#eab308'}; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                    <span class="risk-pill ${txn.level.toLowerCase()}">${txn.level} RISK ALERT</span>
                    <strong style="margin-left: 8px; font-size: 15px;">${txn.id}</strong>
                </div>
                <small style="color: #64748b;">${txn.time}</small>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #f8fafc;">Amount: ₹${txn.amount.toLocaleString("en-IN")}</p>
                    <small style="color: #94a3b8;">Merchant: ${txn.merchant} | Risk Score: ${txn.score}/100</small>
                </div>
                <button onclick="resolveAlert('${txn.id}')" style="background: #1e293b; border: 1px solid #334155; color: #38bdf8; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700;">
                    MARK RESOLVED
                </button>
            </div>
        </div>
    `).join("");
}

function resolveAlert(txnId) {
    AegisState.transactions = AegisState.transactions.filter(t => t.id !== txnId);
    renderFraudAlerts();
    renderDashboardStats();
    renderTransactionTable();
    updateAlertBadge();
}

function renderReasoningBreakdown() {
    const reasoningContainer = document.querySelector(".reasoning-table");
    const scoreBadge = document.getElementById("reasoningScore");
    if (!reasoningContainer) return;

    if (!AegisState.latestAnalysis) {
        reasoningContainer.innerHTML = `<div style="padding: 24px; color: #94a3b8; text-align: center;">No transaction evaluated yet. Run an analysis or payment from the 'Analyze Transaction' view first.</div>`;
        if (scoreBadge) scoreBadge.textContent = "0";
        return;
    }

    const { input, output } = AegisState.latestAnalysis;
    if (scoreBadge) scoreBadge.textContent = output.risk_score;

    const header = `
        <div class="table-row table-heading">
            <span>FEATURE SIGNAL</span>
            <span>OBSERVED VALUE</span>
            <span>BENCHMARK</span>
            <span>RISK CONTRIBUTION</span>
        </div>`;

    const ratio = (input.amount / (input.usual_amount || 1)).toFixed(1);

    const rows = `
        <div class="table-row">
            <strong>Transaction Multiplier</strong>
            <span>₹${input.amount.toLocaleString("en-IN")}</span>
            <span>₹${input.usual_amount.toLocaleString("en-IN")} baseline</span>
            <span style="color: ${ratio > 2 ? '#ef4444' : '#b7ff3c'}; font-weight: 700;">${ratio}x Multiplier</span>
        </div>
        <div class="table-row">
            <strong>Velocity (24H Count)</strong>
            <span>${input.frequency} transactions</span>
            <span>≤ 3 regular threshold</span>
            <span style="color: ${input.frequency > 3 ? '#ef4444' : '#b7ff3c'}; font-weight: 700;">${input.frequency > 3 ? '+25 Points' : '0 Points'}</span>
        </div>
        <div class="table-row">
            <strong>New Recipient Flag</strong>
            <span>${input.new_recipient ? 'TRUE' : 'FALSE'}</span>
            <span>Established contact history</span>
            <span style="color: ${input.new_recipient ? '#eab308' : '#b7ff3c'}; font-weight: 700;">${input.new_recipient ? '+20 Points' : '0 Points'}</span>
        </div>
        <div class="table-row">
            <strong>Location Telemetry</strong>
            <span>${input.unusual_location ? 'Unusual Area' : 'Home Location'}</span>
            <span>Known geolocation profile</span>
            <span style="color: ${input.unusual_location ? '#ef4444' : '#b7ff3c'}; font-weight: 700;">${input.unusual_location ? '+25 Points' : '0 Points'}</span>
        </div>
        <div class="table-row">
            <strong>Execution Time Window</strong>
            <span>${input.transaction_time}</span>
            <span>Standard operating hours</span>
            <span style="color: ${input.transaction_time.includes('AM') ? '#eab308' : '#b7ff3c'}; font-weight: 700;">${input.transaction_time.includes('AM') ? '+10 Points' : '0 Points'}</span>
        </div>
    `;

    reasoningContainer.innerHTML = header + rows;
}

function renderAnalyticsCharts() {
    const riskCtx = document.getElementById("riskDistributionChart");
    const trendCtx = document.getElementById("spendingTrendChart");

    if (!riskCtx || !trendCtx || typeof Chart === "undefined") return;

    if (riskChartInstance) riskChartInstance.destroy();
    if (trendChartInstance) trendChartInstance.destroy();

    riskChartInstance = new Chart(riskCtx, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: ['#b7ff3c', '#eab308', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });

    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Volume (₹)',
                data: [12000, 19000, 3000, 85000, 22000, 45000, 15000],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
                y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });
}