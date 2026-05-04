# PayEase ERPNext Integration — Customer Deployment Guide

## 📋 Overview

**PayEase Integration** is a custom ERPNext V15 module that connects a React-based mobile payment application with ERPNext's accounting and ledger system. It enables digital wallet management, merchant QR payments, bill payments, beneficiary transfers, and real-time transaction tracking — all synced directly into ERPNext.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PayEase Ecosystem                         │
│                                                             │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │  Mobile App      │◄──────►│   ERPNext (bas_pay)      │   │
│  │  (React/Vite)    │  REST  │   PayEase Integration    │   │
│  │                  │  API   │                          │   │
│  │  • Wallet UI     │        │  • Wallet Management     │   │
│  │  • QR Scanner    │        │  • Transaction Ledger    │   │
│  │  • Bill Pay      │        │  • Merchant Registry     │   │
│  │  • Send Money    │◄──────►│  • Reports & Analytics   │   │
│  └─────────────────┘  Webhook└──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 What's Included

### DocTypes (8 Total)

| DocType | Purpose |
|---|---|
| **PayEase Wallet** | User's digital wallet with balance |
| **PayEase Wallet Transaction** | Every money movement (send/receive/pay) |
| **PayEase Merchant** | Registered businesses accepting payments |
| **PayEase QR Code** | QR codes linked to each merchant |
| **PayEase Beneficiary** | Saved contacts for quick transfers |
| **PayEase Bill Payment** | Utility/bill payment records |
| **PayEase Offer** | Cashback & discount campaigns |
| **PayEase Notification Log** | In-app notification history |

### Reports (3 Total)

| Report | Purpose |
|---|---|
| **PayEase Transaction Report** | Full transaction history with filters |
| **PayEase Daily Settlement** | End-of-day merchant reconciliation |
| **PayEase Wallet Summary** | Wallet balance and activity overview |

### API Endpoints (Whitelisted)

| Endpoint | Purpose |
|---|---|
| `bas_pay.payease_integration.api.wallet.get_wallet_balance` | Get user wallet balance |
| `bas_pay.payease_integration.api.transaction.get_recent_transactions` | Transaction history |
| `bas_pay.payease_integration.api.webhook_handler.handle_transaction_webhook` | Receive app events |

---

## 🚀 Server Installation Guide

### Prerequisites
- **ERPNext** V15 (Frappe V15)
- **bench** CLI installed
- **Python** 3.10+
- **Node.js** 18+
- **Git** access to `https://github.com/balaji-001-gif/bas_pay.git`

---

### Step 1 — Get the App

```bash
# On your ERPNext server
cd ~/frappe-bench   # or your bench folder name

# Download the app (skip asset build — backend-only app)
bench get-app https://github.com/balaji-001-gif/bas_pay.git --skip-assets
```

### Step 2 — Install on Your Site

```bash
# Replace 'your-site.com' with your actual ERPNext site name
bench --site your-site.com install-app bas_pay
```

### Step 3 — Run Migration

```bash
bench --site your-site.com migrate
```

**Expected output:**
```
Updating DocTypes for bas_pay  : [========================================] 100%
Updating Dashboard for bas_pay
```

### Step 4 — Verify Installation

```bash
bench --site your-site.com execute frappe.db.sql \
  --args "SELECT name FROM tabDocType WHERE module='PayEase Integration'"
```

You should see all 8 DocType names listed.

---

## 🔧 Post-Installation Configuration

### Step 1 — Create API User

1. Log in to ERPNext as **Administrator**
2. Go to **Settings → User → New User**
3. Create a user: `payease-api@yourcompany.com`
4. Assign Role: **System Manager** (or create a custom PayEase role)
5. Go to the user record → **API Access** tab → **Generate Keys**
6. Copy the **API Key** and **API Secret**

### Step 2 — Configure Roles & Permissions

```
Administrator:  Full access to all PayEase DocTypes
PayEase Admin:  CRUD on Wallets, Merchants, Transactions
PayEase User:   Read-only on their own wallet/transactions
```

To set up roles, go to **Setup → Role → New Role** and create `PayEase Admin`.

### Step 3 — Create First Merchant

1. Go to **PayEase Integration → Merchant Management → PayEase Merchant**
2. Click **New**
3. Fill in:
   - **Merchant Name**: e.g., "ABC Store"
   - **Category**: Retail / Food / Services
   - **Phone**: Merchant contact number
   - **Status**: Active
4. Save → A **Merchant ID** is auto-generated (e.g., `MERCH-0001`)

### Step 4 — Generate Merchant QR Code

1. Go to **PayEase Integration → Merchant Management → PayEase QR Code**
2. Click **New**
3. Link to the Merchant created above
4. Save → A QR string is generated
5. Download/print the QR code for the merchant

---

## 📱 Mobile App Integration

The mobile app (React/Vite) is located in the `.mobile_app/` folder.

### Configuration

1. Create a `.env` file inside `.mobile_app/`:

```env
# ERPNext server URL
VITE_ERPNEXT_URL=https://your-site.com

# API credentials (from the API user you created)
VITE_API_KEY=your_api_key_here
VITE_API_SECRET=your_api_secret_here

# Webhook secret (optional but recommended)
VITE_WEBHOOK_SECRET=your_webhook_secret_here
```

2. Install dependencies and run:
```bash
cd .mobile_app
npm install
npm run dev        # Development
npm run build      # Production build
```

### API Authentication

All API calls from the mobile app use token-based auth:

```
Authorization: token <api_key>:<api_secret>
```

---

## 💼 Day-to-Day Operations

### 1. Wallet Top-up (Add Money)
- Customer adds money via UPI/card through the mobile app
- App calls the ERPNext webhook → `handle_transaction_webhook`
- ERPNext creates a **PayEase Wallet Transaction** (type: Credit)
- Wallet balance is updated automatically

### 2. Send Money (P2P Transfer)
- Sender opens the app → enters receiver's phone/UPI
- App sends a transaction webhook to ERPNext
- ERPNext:
  - Debits sender's wallet
  - Creates a Wallet Transaction record
  - Sends notification to both parties via **PayEase Notification Log**

### 3. Scan & Pay (Merchant Payment)
- Customer scans merchant QR code in the app
- App verifies Merchant ID via ERPNext API
- Customer enters amount → confirms
- ERPNext debits wallet and logs transaction under the merchant

### 4. Bill Payment
- Customer selects a biller (electricity, water, internet, etc.)
- App creates a **PayEase Bill Payment** record in ERPNext
- Payment is processed and status updated to Completed

---

## 📊 Reports Usage

### Transaction Report
**Path**: PayEase Integration → Reports → Transaction Report

Filters:
- Date range
- Wallet / User
- Transaction type (Debit/Credit/Bill Pay)
- Status (Pending/Completed/Failed)

### Daily Settlement
**Path**: PayEase Integration → Reports → Daily Settlement

- Run at end of day
- Shows total merchant collections
- Export as PDF/Excel for reconciliation

### Wallet Summary
**Path**: PayEase Integration → Reports → Wallet Summary

- Shows all active wallets
- Current balance
- Total transacted amount
- Last activity date

---

## 🔔 Notifications

Notifications are auto-triggered on:
- **Large Transaction Alert**: Any transaction above ₹10,000
- **Low Balance Alert**: Wallet balance below ₹100
- **Transaction Failed Alert**: Any failed payment attempt

These appear in the **PayEase Notification Log** and can be pushed to the mobile app.

---

## 🛠️ Maintenance & Troubleshooting

### Re-sync DocTypes after update

```bash
# Pull latest app code
cd apps/bas_pay && git pull origin main && cd ../..

# Re-run migration
bench --site your-site.com migrate
```

### Clear cache if workspace/DocTypes not visible

```bash
bench --site your-site.com clear-cache
bench --site your-site.com clear-website-cache
```

### Check error logs

```bash
# View recent error log
tail -f logs/frappe.log

# Or inside ERPNext
# Go to: Settings → Error Log
```

### Restart services after config changes

```bash
bench restart
# or for production
sudo supervisorctl restart all
```

---

## 🔐 Security Checklist

- [ ] Change default `Administrator` password
- [ ] Enable 2FA for admin accounts
- [ ] Use HTTPS (SSL certificate via Let's Encrypt)
- [ ] Set webhook HMAC secret and validate in `webhook_handler.py`
- [ ] Restrict API user to only the required roles
- [ ] Enable ERPNext's built-in brute-force protection

---

## 📁 Repository Structure

```
bas_pay/                            ← Repository root
├── setup.py                        ← Package installation config
├── requirements.txt                ← Python dependencies
├── MANIFEST.in                     ← Package file inclusion rules
├── .gitignore
│
├── bas_pay/                        ← ERPNext app module
│   ├── __init__.py
│   ├── hooks.py                    ← App hooks & config
│   ├── modules.txt                 ← Module declaration
│   │
│   └── payease_integration/        ← Main module
│       ├── __init__.py
│       │
│       ├── api/                    ← REST API controllers
│       │   ├── wallet.py           ← Wallet balance/info APIs
│       │   ├── transaction.py      ← Transaction history APIs
│       │   └── webhook_handler.py  ← Receives events from mobile app
│       │
│       ├── doctype/
│       │   ├── payease_wallet/
│       │   ├── payease_wallet_transaction/
│       │   ├── payease_merchant/
│       │   ├── payease_qr_code/
│       │   ├── payease_beneficiary/
│       │   ├── payease_bill_payment/
│       │   ├── payease_offer/
│       │   └── payease_notification_log/
│       │
│       ├── report/
│       │   ├── payease_transaction_report/
│       │   ├── payease_daily_settlement/
│       │   └── payease_wallet_summary/
│       │
│       ├── notification/
│       │   ├── large_transaction_alert/
│       │   ├── low_balance_alert/
│       │   └── transaction_failed_alert/
│       │
│       └── workspace/
│           └── payease_integration/
│               └── payease_integration.json ← ERPNext Workspace
│
└── .mobile_app/                    ← React/Vite mobile app (frontend)
    ├── src/
    │   ├── pages/                  ← App screens
    │   ├── components/             ← UI components
    │   └── providers/              ← API/auth providers
    ├── api/                        ← Hono.js backend middleware
    └── package.json
```

---

## 📞 Support

For any deployment issues, refer to the ERPNext error logs or contact your system administrator.

**GitHub Repository**: https://github.com/balaji-001-gif/bas_pay
