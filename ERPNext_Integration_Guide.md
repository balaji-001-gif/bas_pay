# PayEase - ERPNext V15+ / Frappe Framework Integration Guide

> **Complete Setup Guide** for integrating the PayEase Mobile Payment Application with ERPNext V15+ and Frappe Framework. This guide includes all DocTypes, Reports, Workspaces, Server Scripts, Notifications, and source code required to map into your Git repository.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frappe App Structure](#frappe-app-structure)
3. [DocTypes (Data Models)](#doctypes)
4. [Server Scripts](#server-scripts)
5. [Client Scripts](#client-scripts)
6. [Reports](#reports)
7. [Workspaces](#workspaces)
8. [Notifications](#notifications)
9. [REST API Integration](#rest-api-integration)
10. [Print Formats](#print-formats)
11. [Dashboard Charts](#dashboard-charts)
12. [Webhooks](#webhooks)
13. [Roles & Permissions](#roles--permissions)
14. [Git Repository Structure](#git-repository-structure)
15. [Installation & Setup](#installation--setup)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PayEase Payment App                           │
│                    (React + tRPC + Drizzle ORM + Hono)                   │
│                          Mobile-First Frontend                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         REST API / Webhook Layer                        │
├─────────────────────────────────────────────────────────────────────────┤
│                         ERPNext V15+ / Frappe                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ DocTypes │ │ Reports  │ │Workspace │ │Notifications│ │Server Scripts│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ └──────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PayEase Frappe App (Custom App)                  │  │
│  │         payease_erpnext/                                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration Flow
1. **User** initiates payment via PayEase mobile app
2. **PayEase Backend** processes transaction via tRPC + Drizzle ORM
3. **ERPNext** receives transaction data via REST API / Webhook
4. **ERPNext** creates corresponding ERP entries (Journal Entry, Payment Entry, etc.)
5. **ERPNext Dashboard** displays real-time payment analytics

---

## Frappe App Structure

### Directory Layout (Git Repository)

```
payease_erpnext/
├── payease_erpnext/
│   ├── __init__.py
│   ├── hooks.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── wallet.py
│   │   ├── transaction.py
│   │   └── webhook_handler.py
│   ├── payease_erpnext/
│   │   ├── __init__.py
│   │   ├── doctype/
│   │   │   ├── __init__.py
│   │   │   ├── payease_wallet/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_wallet.js
│   │   │   │   ├── payease_wallet.json
│   │   │   │   ├── payease_wallet.py
│   │   │   │   ├── payease_wallet_list.js
│   │   │   │   └── test_payease_wallet.py
│   │   │   ├── payease_wallet_transaction/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_wallet_transaction.js
│   │   │   │   ├── payease_wallet_transaction.json
│   │   │   │   ├── payease_wallet_transaction.py
│   │   │   │   ├── payease_wallet_transaction_list.js
│   │   │   │   └── test_payease_wallet_transaction.py
│   │   │   ├── payease_beneficiary/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_beneficiary.json
│   │   │   │   ├── payease_beneficiary.py
│   │   │   │   └── test_payease_beneficiary.py
│   │   │   ├── payease_merchant/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_merchant.json
│   │   │   │   ├── payease_merchant.py
│   │   │   │   └── test_payease_merchant.py
│   │   │   ├── payease_bill_payment/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_bill_payment.json
│   │   │   │   ├── payease_bill_payment.py
│   │   │   │   └── test_payease_bill_payment.py
│   │   │   ├── payease_qr_code/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_qr_code.json
│   │   │   │   ├── payease_qr_code.py
│   │   │   │   └── test_payease_qr_code.py
│   │   │   ├── payease_notification_log/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_notification_log.json
│   │   │   │   ├── payease_notification_log.py
│   │   │   │   └── test_payease_notification_log.py
│   │   │   └── payease_offer/
│   │   │       ├── __init__.py
│   │   │       ├── payease_offer.json
│   │   │       ├── payease_offer.py
│   │   │       └── test_payease_offer.py
│   │   ├── report/
│   │   │   ├── __init__.py
│   │   │   ├── payease_transaction_report/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_transaction_report.js
│   │   │   │   ├── payease_transaction_report.json
│   │   │   │   └── payease_transaction_report.py
│   │   │   ├── payease_wallet_summary/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_wallet_summary.js
│   │   │   │   ├── payease_wallet_summary.json
│   │   │   │   └── payease_wallet_summary.py
│   │   │   ├── payease_daily_settlement/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── payease_daily_settlement.js
│   │   │   │   ├── payease_daily_settlement.json
│   │   │   │   └── payease_daily_settlement.py
│   │   │   └── payease_merchant_payout/
│   │   │       ├── __init__.py
│   │   │       ├── payease_merchant_payout.js
│   │   │       ├── payease_merchant_payout.json
│   │   │       └── payease_merchant_payout.py
│   │   ├── workspace/
│   │   │   ├── __init__.py
│   │   │   └── payease/
│   │   │       ├── __init__.py
│   │   │       └── payease.json
│   │   ├── notification/
│   │   │   ├── __init__.py
│   │   │   ├── low_balance_alert/
│   │   │   │   ├── __init__.py
│   │   │   │   └── low_balance_alert.json
│   │   │   ├── large_transaction_alert/
│   │   │   │   ├── __init__.py
│   │   │   │   └── large_transaction_alert.json
│   │   │   └── transaction_failed_alert/
│   │   │       ├── __init__.py
│   │   │       └── transaction_failed_alert.json
│   │   └── print_format/
│   │       ├── __init__.py
│   │       ├── payease_receipt/
│   │       │   ├── __init__.py
│   │       │   └── payease_receipt.json
│   │       └── payease_statement/
│   │           ├── __init__.py
│   │           └── payease_statement.json
│   ├── config/
│   │   ├── __init__.py
│   │   └── desktop.py
│   ├── templates/
│   │   └── pages/
│   │       └── __init__.py
│   └── www/
│       └── __init__.py
├── requirements.txt
├── setup.py
├── MANIFEST.in
├── README.md
├── LICENSE
└── .gitignore
```

---

## DocTypes

### 1. PayEase Wallet (`payease_wallet`)

**File:** `payease_erpnext/payease_erpnext/doctype/payease_wallet/payease_wallet.json`

```json
{
  "actions": [],
  "allow_rename": 1,
  "autoname": "field:wallet_id",
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "wallet_id",
    "user_section",
    "user_email",
    "user_phone",
    "user_name",
    "balance_section",
    "balance",
    "currency",
    "held_balance",
    "limits_section",
    "daily_limit",
    "monthly_limit",
    "per_transaction_limit",
    "status_section",
    "status",
    "kyc_status",
    "kyc_level",
    "security_section",
    "pin_set",
    "two_factor_enabled",
    "meta_section",
    "erpnext_customer",
    "created_from_app",
    "column_break_meta",
    "last_transaction_at",
    "total_transactions",
    "amended_from"
  ],
  "fields": [
    {
      "fieldname": "wallet_id",
      "fieldtype": "Data",
      "label": "Wallet ID",
      "reqd": 1,
      "unique": 1
    },
    {
      "fieldname": "user_section",
      "fieldtype": "Section Break",
      "label": "User Information"
    },
    {
      "fieldname": "user_email",
      "fieldtype": "Data",
      "label": "User Email",
      "options": "Email"
    },
    {
      "fieldname": "user_phone",
      "fieldtype": "Data",
      "label": "User Phone",
      "options": "Phone"
    },
    {
      "fieldname": "user_name",
      "fieldtype": "Data",
      "label": "User Name"
    },
    {
      "fieldname": "balance_section",
      "fieldtype": "Section Break",
      "label": "Balance Details"
    },
    {
      "fieldname": "balance",
      "fieldtype": "Currency",
      "label": "Available Balance",
      "default": "0",
      "reqd": 1
    },
    {
      "fieldname": "currency",
      "fieldtype": "Select",
      "label": "Currency",
      "options": "INR\nUSD\nEUR\nGBP",
      "default": "INR"
    },
    {
      "fieldname": "held_balance",
      "fieldtype": "Currency",
      "label": "Held Balance",
      "default": "0",
      "read_only": 1
    },
    {
      "fieldname": "limits_section",
      "fieldtype": "Section Break",
      "label": "Transaction Limits"
    },
    {
      "fieldname": "daily_limit",
      "fieldtype": "Currency",
      "label": "Daily Limit",
      "default": "50000"
    },
    {
      "fieldname": "monthly_limit",
      "fieldtype": "Currency",
      "label": "Monthly Limit",
      "default": "500000"
    },
    {
      "fieldname": "per_transaction_limit",
      "fieldtype": "Currency",
      "label": "Per Transaction Limit",
      "default": "100000"
    },
    {
      "fieldname": "status_section",
      "fieldtype": "Section Break",
      "label": "Status"
    },
    {
      "fieldname": "status",
      "fieldtype": "Select",
      "label": "Wallet Status",
      "options": "Active\nInactive\nSuspended\nClosed",
      "default": "Active",
      "reqd": 1
    },
    {
      "fieldname": "kyc_status",
      "fieldtype": "Select",
      "label": "KYC Status",
      "options": "Pending\nVerified\nRejected\nUnder Review",
      "default": "Pending"
    },
    {
      "fieldname": "kyc_level",
      "fieldtype": "Select",
      "label": "KYC Level",
      "options": "Level 0\nLevel 1\nLevel 2\nLevel 3",
      "default": "Level 0"
    },
    {
      "fieldname": "security_section",
      "fieldtype": "Section Break",
      "label": "Security"
    },
    {
      "fieldname": "pin_set",
      "fieldtype": "Check",
      "label": "PIN Set",
      "default": "0"
    },
    {
      "fieldname": "two_factor_enabled",
      "fieldtype": "Check",
      "label": "Two Factor Enabled",
      "default": "0"
    },
    {
      "fieldname": "meta_section",
      "fieldtype": "Section Break",
      "label": "ERPNext Integration"
    },
    {
      "fieldname": "erpnext_customer",
      "fieldtype": "Link",
      "label": "ERPNext Customer",
      "options": "Customer"
    },
    {
      "fieldname": "created_from_app",
      "fieldtype": "Check",
      "label": "Created from App",
      "default": "1",
      "read_only": 1
    },
    {
      "fieldname": "column_break_meta",
      "fieldtype": "Column Break"
    },
    {
      "fieldname": "last_transaction_at",
      "fieldtype": "Datetime",
      "label": "Last Transaction At",
      "read_only": 1
    },
    {
      "fieldname": "total_transactions",
      "fieldtype": "Int",
      "label": "Total Transactions",
      "default": "0",
      "read_only": 1
    },
    {
      "fieldname": "amended_from",
      "fieldtype": "Link",
      "label": "Amended From",
      "no_copy": 1,
      "options": "PayEase Wallet",
      "print_hide": 1,
      "read_only": 1
    }
  ],
  "index_web_pages_for_search": 1,
  "links": [
    {
      "group": "Transactions",
      "link_doctype": "PayEase Wallet Transaction",
      "link_fieldname": "wallet"
    }
  ],
  "istable": 0,
  "is_submittable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "modified_by": "Administrator",
  "module": "PayEase",
  "name": "PayEase Wallet",
  "naming_rule": "By fieldname",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    },
    {
      "create": 0,
      "delete": 0,
      "email": 1,
      "export": 0,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Support",
      "share": 0,
      "write": 0
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "states": [],
  "track_changes": 1,
  "track_seen": 1,
  "track_views": 1
}
```

**Python Controller:** `payease_erpnext/payease_erpnext/doctype/payease_wallet/payease_wallet.py`

```python
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class PayEaseWallet(Document):
    def validate(self):
        self.validate_limits()
        self.sync_customer()
    
    def validate_limits(self):
        if self.daily_limit > self.monthly_limit:
            frappe.throw("Daily limit cannot exceed monthly limit")
        if self.per_transaction_limit > self.daily_limit:
            frappe.throw("Per transaction limit cannot exceed daily limit")
    
    def sync_customer(self):
        if not self.erpnext_customer and self.user_email:
            existing = frappe.db.get_value("Customer", {"email_id": self.user_email}, "name")
            if existing:
                self.erpnext_customer = existing
            else:
                customer = frappe.get_doc({
                    "doctype": "Customer",
                    "customer_name": self.user_name or self.user_email,
                    "email_id": self.user_email,
                    "mobile_no": self.user_phone,
                    "customer_type": "Individual",
                    "customer_group": "All Customer Groups",
                    "territory": "All Territories"
                })
                customer.insert(ignore_permissions=True)
                self.erpnext_customer = customer.name
    
    def update_balance(self, amount, transaction_type):
        if transaction_type in ["add_money", "receive_money", "refund"]:
            self.balance += amount
        else:
            if self.balance < amount:
                frappe.throw("Insufficient wallet balance")
            self.balance -= amount
        
        self.held_balance = max(0, self.held_balance)
        self.last_transaction_at = now_datetime()
        self.total_transactions += 1
        self.save()
    
    def get_daily_spent(self):
        today = frappe.utils.today()
        result = frappe.db.sql("""
            SELECT COALESCE(SUM(amount), 0) 
            FROM `tabPayEase Wallet Transaction` 
            WHERE wallet = %s 
            AND DATE(creation) = %s 
            AND type IN ('send_money', 'pay_bill', 'qr_payment')
            AND status = 'Completed'
        """, (self.name, today))
        return result[0][0] if result else 0

```

---

### 2. PayEase Wallet Transaction (`payease_wallet_transaction`)

**File:** `payease_erpnext/payease_erpnext/doctype/payease_wallet_transaction/payease_wallet_transaction.json`

```json
{
  "actions": [],
  "allow_rename": 1,
  "autoname": "field:transaction_id",
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "transaction_id",
    "transaction_details_section",
    "wallet",
    "type",
    "status",
    "amount",
    "currency",
    "column_break_txn",
    "sender_wallet",
    "receiver_wallet",
    "receiver_phone",
    "receiver_upi_id",
    "receiver_name",
    "payment_info_section",
    "payment_method",
    "description",
    "remark",
    "category",
    "offer_applied",
    "discount_amount",
    "meta_section",
    "reference_number",
    "gateway_response",
    "failure_reason",
    "completed_at",
    "reconciliation_section",
    "journal_entry",
    "payment_entry",
    "sales_invoice",
    "amended_from"
  ],
  "fields": [
    {
      "fieldname": "transaction_id",
      "fieldtype": "Data",
      "label": "Transaction ID",
      "reqd": 1,
      "unique": 1
    },
    {
      "fieldname": "transaction_details_section",
      "fieldtype": "Section Break",
      "label": "Transaction Details"
    },
    {
      "fieldname": "wallet",
      "fieldtype": "Link",
      "label": "Primary Wallet",
      "options": "PayEase Wallet",
      "reqd": 1
    },
    {
      "fieldname": "type",
      "fieldtype": "Select",
      "label": "Transaction Type",
      "options": "send_money\nreceive_money\nadd_money\nwithdraw\npay_bill\nrecharge\nqr_payment\nrefund",
      "reqd": 1
    },
    {
      "fieldname": "status",
      "fieldtype": "Select",
      "label": "Status",
      "options": "Pending\nCompleted\nFailed\nCancelled\nRefunded",
      "default": "Pending",
      "reqd": 1,
      "in_list_view": 1
    },
    {
      "fieldname": "amount",
      "fieldtype": "Currency",
      "label": "Amount",
      "reqd": 1,
      "in_list_view": 1
    },
    {
      "fieldname": "currency",
      "fieldtype": "Select",
      "label": "Currency",
      "options": "INR\nUSD\nEUR\nGBP",
      "default": "INR"
    },
    {
      "fieldname": "column_break_txn",
      "fieldtype": "Column Break"
    },
    {
      "fieldname": "sender_wallet",
      "fieldtype": "Link",
      "label": "Sender Wallet",
      "options": "PayEase Wallet"
    },
    {
      "fieldname": "receiver_wallet",
      "fieldtype": "Link",
      "label": "Receiver Wallet",
      "options": "PayEase Wallet"
    },
    {
      "fieldname": "receiver_phone",
      "fieldtype": "Data",
      "label": "Receiver Phone"
    },
    {
      "fieldname": "receiver_upi_id",
      "fieldtype": "Data",
      "label": "Receiver UPI ID"
    },
    {
      "fieldname": "receiver_name",
      "fieldtype": "Data",
      "label": "Receiver Name"
    },
    {
      "fieldname": "payment_info_section",
      "fieldtype": "Section Break",
      "label": "Payment Information"
    },
    {
      "fieldname": "payment_method",
      "fieldtype": "Select",
      "label": "Payment Method",
      "options": "wallet\nupi\ncard\nnetbanking\ncash",
      "default": "wallet"
    },
    {
      "fieldname": "description",
      "fieldtype": "Text",
      "label": "Description"
    },
    {
      "fieldname": "remark",
      "fieldtype": "Data",
      "label": "Remark"
    },
    {
      "fieldname": "category",
      "fieldtype": "Select",
      "label": "Category",
      "options": "food\nshopping\ntravel\nentertainment\nbills\nrecharge\ntransfer\nother",
      "default": "other"
    },
    {
      "fieldname": "offer_applied",
      "fieldtype": "Link",
      "label": "Offer Applied",
      "options": "PayEase Offer"
    },
    {
      "fieldname": "discount_amount",
      "fieldtype": "Currency",
      "label": "Discount Amount",
      "default": "0"
    },
    {
      "fieldname": "meta_section",
      "fieldtype": "Section Break",
      "label": "Metadata"
    },
    {
      "fieldname": "reference_number",
      "fieldtype": "Data",
      "label": "Bank Reference Number"
    },
    {
      "fieldname": "gateway_response",
      "fieldtype": "Code",
      "label": "Gateway Response",
      "options": "JSON"
    },
    {
      "fieldname": "failure_reason",
      "fieldtype": "Text",
      "label": "Failure Reason"
    },
    {
      "fieldname": "completed_at",
      "fieldtype": "Datetime",
      "label": "Completed At"
    },
    {
      "fieldname": "reconciliation_section",
      "fieldtype": "Section Break",
      "label": "ERPNext Reconciliation"
    },
    {
      "fieldname": "journal_entry",
      "fieldtype": "Link",
      "label": "Journal Entry",
      "options": "Journal Entry",
      "read_only": 1
    },
    {
      "fieldname": "payment_entry",
      "fieldtype": "Link",
      "label": "Payment Entry",
      "options": "Payment Entry",
      "read_only": 1
    },
    {
      "fieldname": "sales_invoice",
      "fieldtype": "Link",
      "label": "Sales Invoice",
      "options": "Sales Invoice",
      "read_only": 1
    },
    {
      "fieldname": "amended_from",
      "fieldtype": "Link",
      "label": "Amended From",
      "no_copy": 1,
      "options": "PayEase Wallet Transaction",
      "print_hide": 1,
      "read_only": 1
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "is_submittable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "modified_by": "Administrator",
  "module": "PayEase",
  "name": "PayEase Wallet Transaction",
  "naming_rule": "By fieldname",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    },
    {
      "create": 0,
      "delete": 0,
      "email": 1,
      "export": 0,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Support",
      "share": 0,
      "write": 0
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "states": [
    {
      "color": "Orange",
      "title": "Pending"
    },
    {
      "color": "Green",
      "title": "Completed"
    },
    {
      "color": "Red",
      "title": "Failed"
    },
    {
      "color": "Gray",
      "title": "Cancelled"
    }
  ],
  "title_field": "transaction_id",
  "track_changes": 1
}
```

**Python Controller:** `payease_erpnext/payease_erpnext/doctype/payease_wallet_transaction/payease_wallet_transaction.py`

```python
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

class PayEaseWalletTransaction(Document):
    def validate(self):
        if self.status == "Completed" and not self.completed_at:
            self.completed_at = now_datetime()
    
    def on_update(self):
        if self.status == "Completed" and not self.journal_entry:
            self.create_journal_entry()
        
        self.update_wallet_balance()
    
    def create_journal_entry(self):
        if self.type in ["add_money", "receive_money"]:
            # Debit: Bank / Payment Gateway Account
            # Credit: Wallet Control Account
            je = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "posting_date": frappe.utils.today(),
                "company": frappe.defaults.get_user_default("Company"),
                "accounts": [
                    {
                        "account": self.get_wallet_control_account(),
                        "debit_in_account_currency": 0,
                        "credit_in_account_currency": self.amount,
                        "reference_type": "PayEase Wallet Transaction",
                        "reference_name": self.name
                    },
                    {
                        "account": self.get_bank_account(),
                        "debit_in_account_currency": self.amount,
                        "credit_in_account_currency": 0
                    }
                ],
                "user_remark": f"PayEase {self.type}: {self.transaction_id}"
            })
            je.insert()
            je.submit()
            self.db_set("journal_entry", je.name)
        
        elif self.type in ["send_money", "pay_bill", "qr_payment"]:
            # Debit: Wallet Control Account
            # Credit: Wallet Control Account (receiver side) or Expense Account
            je = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "posting_date": frappe.utils.today(),
                "company": frappe.defaults.get_user_default("Company"),
                "accounts": [
                    {
                        "account": self.get_wallet_control_account(),
                        "debit_in_account_currency": self.amount,
                        "credit_in_account_currency": 0,
                        "reference_type": "PayEase Wallet Transaction",
                        "reference_name": self.name
                    },
                    {
                        "account": self.get_expense_account(),
                        "debit_in_account_currency": 0,
                        "credit_in_account_currency": self.amount
                    }
                ],
                "user_remark": f"PayEase {self.type}: {self.transaction_id}"
            })
            je.insert()
            je.submit()
            self.db_set("journal_entry", je.name)
    
    def update_wallet_balance(self):
        if self.status == "Completed":
            wallet = frappe.get_doc("PayEase Wallet", self.wallet)
            wallet.update_balance(self.amount, self.type)
    
    def get_wallet_control_account(self):
        return frappe.db.get_single_value("PayEase Settings", "wallet_control_account") or "PayEase Wallet Control - _TC"
    
    def get_bank_account(self):
        return frappe.db.get_single_value("PayEase Settings", "bank_account") or "Bank Account - _TC"
    
    def get_expense_account(self):
        category_accounts = {
            "food": "Expenses - _TC",
            "shopping": "Expenses - _TC",
            "travel": "Expenses - _TC",
            "entertainment": "Expenses - _TC",
            "bills": "Utility Expenses - _TC",
            "recharge": "Utility Expenses - _TC",
            "transfer": "PayEase Wallet Control - _TC",
            "other": "Miscellaneous Expenses - _TC"
        }
        return category_accounts.get(self.category, "Miscellaneous Expenses - _TC")
```

---

### 3. PayEase Beneficiary (`payease_beneficiary`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "user",
    "name1",
    "phone",
    "upi_id",
    "bank_details_section",
    "bank_account_number",
    "bank_ifsc",
    "bank_name",
    "preferences_section",
    "is_favorite",
    "last_paid_amount",
    "last_paid_date",
    "total_payments"
  ],
  "fields": [
    {
      "fieldname": "user",
      "fieldtype": "Link",
      "label": "User",
      "options": "User",
      "reqd": 1
    },
    {
      "fieldname": "name1",
      "fieldtype": "Data",
      "label": "Name",
      "reqd": 1
    },
    {
      "fieldname": "phone",
      "fieldtype": "Data",
      "label": "Phone",
      "reqd": 1
    },
    {
      "fieldname": "upi_id",
      "fieldtype": "Data",
      "label": "UPI ID"
    },
    {
      "fieldname": "bank_details_section",
      "fieldtype": "Section Break",
      "label": "Bank Details"
    },
    {
      "fieldname": "bank_account_number",
      "fieldtype": "Data",
      "label": "Account Number"
    },
    {
      "fieldname": "bank_ifsc",
      "fieldtype": "Data",
      "label": "IFSC Code"
    },
    {
      "fieldname": "bank_name",
      "fieldtype": "Data",
      "label": "Bank Name"
    },
    {
      "fieldname": "preferences_section",
      "fieldtype": "Section Break",
      "label": "Preferences"
    },
    {
      "fieldname": "is_favorite",
      "fieldtype": "Check",
      "label": "Is Favorite",
      "default": "0"
    },
    {
      "fieldname": "last_paid_amount",
      "fieldtype": "Currency",
      "label": "Last Paid Amount",
      "read_only": 1
    },
    {
      "fieldname": "last_paid_date",
      "fieldtype": "Date",
      "label": "Last Paid Date",
      "read_only": 1
    },
    {
      "fieldname": "total_payments",
      "fieldtype": "Int",
      "label": "Total Payments",
      "default": "0",
      "read_only": 1
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Beneficiary",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "title_field": "name1",
  "track_changes": 1
}
```

---

### 4. PayEase Merchant (`payease_merchant`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "merchant_name",
    "category",
    "contact_section",
    "phone",
    "email",
    "upi_id",
    "bank_account",
    "bank_ifsc",
    "settings_section",
    "commission_rate",
    "settlement_cycle",
    "is_active",
    "logo",
    "erpnext_links_section",
    "supplier",
    "customer"
  ],
  "fields": [
    {
      "fieldname": "merchant_name",
      "fieldtype": "Data",
      "label": "Merchant Name",
      "reqd": 1
    },
    {
      "fieldname": "category",
      "fieldtype": "Select",
      "label": "Category",
      "options": "food\nshopping\ntravel\nentertainment\nbills\nrecharge\ngroceries\nhealth\nother",
      "default": "other"
    },
    {
      "fieldname": "contact_section",
      "fieldtype": "Section Break",
      "label": "Contact Information"
    },
    {
      "fieldname": "phone",
      "fieldtype": "Data",
      "label": "Phone"
    },
    {
      "fieldname": "email",
      "fieldtype": "Data",
      "label": "Email",
      "options": "Email"
    },
    {
      "fieldname": "upi_id",
      "fieldtype": "Data",
      "label": "UPI ID"
    },
    {
      "fieldname": "bank_account",
      "fieldtype": "Data",
      "label": "Bank Account Number"
    },
    {
      "fieldname": "bank_ifsc",
      "fieldtype": "Data",
      "label": "IFSC Code"
    },
    {
      "fieldname": "settings_section",
      "fieldtype": "Section Break",
      "label": "Settings"
    },
    {
      "fieldname": "commission_rate",
      "fieldtype": "Percent",
      "label": "Commission Rate",
      "default": "0"
    },
    {
      "fieldname": "settlement_cycle",
      "fieldtype": "Select",
      "label": "Settlement Cycle",
      "options": "Daily\nWeekly\nBi-Weekly\nMonthly",
      "default": "Daily"
    },
    {
      "fieldname": "is_active",
      "fieldtype": "Check",
      "label": "Is Active",
      "default": "1"
    },
    {
      "fieldname": "logo",
      "fieldtype": "Attach Image",
      "label": "Logo"
    },
    {
      "fieldname": "erpnext_links_section",
      "fieldtype": "Section Break",
      "label": "ERPNext Links"
    },
    {
      "fieldname": "supplier",
      "fieldtype": "Link",
      "label": "Supplier",
      "options": "Supplier"
    },
    {
      "fieldname": "customer",
      "fieldtype": "Link",
      "label": "Customer",
      "options": "Customer"
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Merchant",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "title_field": "merchant_name",
  "track_changes": 1
}
```

---

### 5. PayEase Bill Payment (`payease_bill_payment`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "user",
    "biller_id",
    "biller_name",
    "category",
    "consumer_number",
    "bill_details_section",
    "bill_amount",
    "paid_amount",
    "convenience_fee",
    "status",
    "payment_section",
    "transaction",
    "payment_method",
    "payment_date",
    "due_date",
    "bill_period",
    "meta_section",
    "bill_date",
    "bill_number",
    "metadata"
  ],
  "fields": [
    {
      "fieldname": "user",
      "fieldtype": "Link",
      "label": "User",
      "options": "User",
      "reqd": 1
    },
    {
      "fieldname": "biller_id",
      "fieldtype": "Data",
      "label": "Biller ID",
      "reqd": 1
    },
    {
      "fieldname": "biller_name",
      "fieldtype": "Data",
      "label": "Biller Name",
      "reqd": 1
    },
    {
      "fieldname": "category",
      "fieldtype": "Select",
      "label": "Category",
      "options": "electricity\nwater\ngas\nbroadband\nmobile\ndth\ninsurance\ncredit_card\nloan\ntax\nother",
      "reqd": 1
    },
    {
      "fieldname": "consumer_number",
      "fieldtype": "Data",
      "label": "Consumer Number",
      "reqd": 1
    },
    {
      "fieldname": "bill_details_section",
      "fieldtype": "Section Break",
      "label": "Bill Details"
    },
    {
      "fieldname": "bill_amount",
      "fieldtype": "Currency",
      "label": "Bill Amount",
      "reqd": 1
    },
    {
      "fieldname": "paid_amount",
      "fieldtype": "Currency",
      "label": "Paid Amount",
      "default": "0"
    },
    {
      "fieldname": "convenience_fee",
      "fieldtype": "Currency",
      "label": "Convenience Fee",
      "default": "0"
    },
    {
      "fieldname": "status",
      "fieldtype": "Select",
      "label": "Status",
      "options": "Pending\nCompleted\nFailed",
      "default": "Pending",
      "reqd": 1
    },
    {
      "fieldname": "payment_section",
      "fieldtype": "Section Break",
      "label": "Payment Information"
    },
    {
      "fieldname": "transaction",
      "fieldtype": "Link",
      "label": "Wallet Transaction",
      "options": "PayEase Wallet Transaction"
    },
    {
      "fieldname": "payment_method",
      "fieldtype": "Select",
      "label": "Payment Method",
      "options": "wallet\nupi\ncard\nnetbanking",
      "default": "wallet"
    },
    {
      "fieldname": "payment_date",
      "fieldtype": "Datetime",
      "label": "Payment Date"
    },
    {
      "fieldname": "due_date",
      "fieldtype": "Date",
      "label": "Due Date"
    },
    {
      "fieldname": "bill_period",
      "fieldtype": "Data",
      "label": "Bill Period"
    },
    {
      "fieldname": "meta_section",
      "fieldtype": "Section Break",
      "label": "Additional Information"
    },
    {
      "fieldname": "bill_date",
      "fieldtype": "Date",
      "label": "Bill Date"
    },
    {
      "fieldname": "bill_number",
      "fieldtype": "Data",
      "label": "Bill Number"
    },
    {
      "fieldname": "metadata",
      "fieldtype": "Code",
      "label": "Metadata",
      "options": "JSON"
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Bill Payment",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "track_changes": 1
}
```

---

### 6. PayEase Notification Log (`payease_notification_log`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "user",
    "title",
    "message",
    "type",
    "is_read",
    "action_url",
    "metadata",
    "sent_via",
    "read_at"
  ],
  "fields": [
    {
      "fieldname": "user",
      "fieldtype": "Link",
      "label": "User",
      "options": "User",
      "reqd": 1
    },
    {
      "fieldname": "title",
      "fieldtype": "Data",
      "label": "Title",
      "reqd": 1
    },
    {
      "fieldname": "message",
      "fieldtype": "Text",
      "label": "Message",
      "reqd": 1
    },
    {
      "fieldname": "type",
      "fieldtype": "Select",
      "label": "Type",
      "options": "transaction\npromo\nsecurity\nsystem\npayment_reminder",
      "default": "system"
    },
    {
      "fieldname": "is_read",
      "fieldtype": "Check",
      "label": "Is Read",
      "default": "0"
    },
    {
      "fieldname": "action_url",
      "fieldtype": "Data",
      "label": "Action URL"
    },
    {
      "fieldname": "metadata",
      "fieldtype": "Code",
      "label": "Metadata",
      "options": "JSON"
    },
    {
      "fieldname": "sent_via",
      "fieldtype": "Select",
      "label": "Sent Via",
      "options": "app\nemail\nsms\npush",
      "default": "app"
    },
    {
      "fieldname": "read_at",
      "fieldtype": "Datetime",
      "label": "Read At"
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Notification Log",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "track_changes": 1
}
```

---

### 7. PayEase Offer (`payease_offer`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "offer_code",
    "title",
    "description",
    "discount_section",
    "discount_type",
    "discount_value",
    "max_discount",
    "min_transaction",
    "validity_section",
    "category",
    "start_date",
    "end_date",
    "usage_section",
    "usage_limit",
    "usage_count",
    "is_active"
  ],
  "fields": [
    {
      "fieldname": "offer_code",
      "fieldtype": "Data",
      "label": "Offer Code",
      "reqd": 1,
      "unique": 1
    },
    {
      "fieldname": "title",
      "fieldtype": "Data",
      "label": "Title",
      "reqd": 1
    },
    {
      "fieldname": "description",
      "fieldtype": "Text",
      "label": "Description"
    },
    {
      "fieldname": "discount_section",
      "fieldtype": "Section Break",
      "label": "Discount Details"
    },
    {
      "fieldname": "discount_type",
      "fieldtype": "Select",
      "label": "Discount Type",
      "options": "percentage\nfixed_amount\ncashback",
      "default": "cashback"
    },
    {
      "fieldname": "discount_value",
      "fieldtype": "Currency",
      "label": "Discount Value",
      "default": "0"
    },
    {
      "fieldname": "max_discount",
      "fieldtype": "Currency",
      "label": "Max Discount"
    },
    {
      "fieldname": "min_transaction",
      "fieldtype": "Currency",
      "label": "Min Transaction",
      "default": "0"
    },
    {
      "fieldname": "validity_section",
      "fieldtype": "Section Break",
      "label": "Validity"
    },
    {
      "fieldname": "category",
      "fieldtype": "Select",
      "label": "Category",
      "options": "food\nshopping\ntravel\nentertainment\nbills\nrecharge\ntransfer\nall",
      "default": "all"
    },
    {
      "fieldname": "start_date",
      "fieldtype": "Datetime",
      "label": "Start Date",
      "default": "Now"
    },
    {
      "fieldname": "end_date",
      "fieldtype": "Datetime",
      "label": "End Date",
      "reqd": 1
    },
    {
      "fieldname": "usage_section",
      "fieldtype": "Section Break",
      "label": "Usage Limits"
    },
    {
      "fieldname": "usage_limit",
      "fieldtype": "Int",
      "label": "Usage Limit",
      "default": "0",
      "description": "0 = Unlimited"
    },
    {
      "fieldname": "usage_count",
      "fieldtype": "Int",
      "label": "Usage Count",
      "default": "0",
      "read_only": 1
    },
    {
      "fieldname": "is_active",
      "fieldtype": "Check",
      "label": "Is Active",
      "default": "1"
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Offer",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "title_field": "title",
  "track_changes": 1
}
```

---

### 8. PayEase QR Code (`payease_qr_code`)

```json
{
  "actions": [],
  "creation": "2026-04-30 10:00:00.000000",
  "doctype": "DocType",
  "engine": "InnoDB",
  "field_order": [
    "qr_id",
    "user",
    "merchant",
    "qr_data",
    "amount",
    "is_dynamic",
    "is_active",
    "expires_at",
    "scans",
    "last_scanned_at"
  ],
  "fields": [
    {
      "fieldname": "qr_id",
      "fieldtype": "Data",
      "label": "QR ID",
      "reqd": 1,
      "unique": 1
    },
    {
      "fieldname": "user",
      "fieldtype": "Link",
      "label": "User",
      "options": "User"
    },
    {
      "fieldname": "merchant",
      "fieldtype": "Link",
      "label": "Merchant",
      "options": "PayEase Merchant"
    },
    {
      "fieldname": "qr_data",
      "fieldtype": "Code",
      "label": "QR Data",
      "reqd": 1,
      "options": "JSON"
    },
    {
      "fieldname": "amount",
      "fieldtype": "Currency",
      "label": "Fixed Amount"
    },
    {
      "fieldname": "is_dynamic",
      "fieldtype": "Check",
      "label": "Is Dynamic",
      "default": "0"
    },
    {
      "fieldname": "is_active",
      "fieldtype": "Check",
      "label": "Is Active",
      "default": "1"
    },
    {
      "fieldname": "expires_at",
      "fieldtype": "Datetime",
      "label": "Expires At"
    },
    {
      "fieldname": "scans",
      "fieldtype": "Int",
      "label": "Scan Count",
      "default": "0",
      "read_only": 1
    },
    {
      "fieldname": "last_scanned_at",
      "fieldtype": "Datetime",
      "label": "Last Scanned At",
      "read_only": 1
    }
  ],
  "index_web_pages_for_search": 1,
  "istable": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase QR Code",
  "owner": "Administrator",
  "permissions": [
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "System Manager",
      "share": 1,
      "write": 1
    },
    {
      "create": 1,
      "delete": 1,
      "email": 1,
      "export": 1,
      "print": 1,
      "read": 1,
      "report": 1,
      "role": "PayEase Admin",
      "share": 1,
      "write": 1
    }
  ],
  "sort_field": "modified",
  "sort_order": "DESC",
  "track_changes": 1
}
```

---

## Server Scripts

### 1. Webhook Handler (`payease_erpnext/api/webhook_handler.py`)

```python
import frappe
import json
from frappe.utils import now_datetime

@frappe.whitelist(allow_guest=True)
def handle_transaction_webhook():
    """
    Receives transaction webhook from PayEase app
    Endpoint: /api/method/payease_erpnext.api.webhook_handler.handle_transaction_webhook
    """
    data = frappe.request.get_json()
    
    if not data:
        frappe.throw("No data received")
    
    try:
        # Validate webhook signature (implement HMAC verification)
        # verify_webhook_signature(frappe.request.headers, frappe.request.get_data())
        
        event_type = data.get("event")
        transaction_data = data.get("transaction")
        
        if event_type == "transaction.completed":
            create_erpnext_transaction(transaction_data)
        elif event_type == "transaction.failed":
            log_failed_transaction(transaction_data)
        elif event_type == "wallet.updated":
            sync_wallet_balance(transaction_data)
        
        return {"status": "success", "message": "Webhook processed"}
    
    except Exception as e:
        frappe.log_error(f"PayEase Webhook Error: {str(e)}", "PayEase Webhook")
        return {"status": "error", "message": str(e)}

def create_erpnext_transaction(txn_data):
    """Create PayEase Wallet Transaction in ERPNext"""
    
    # Check if already exists
    existing = frappe.db.exists("PayEase Wallet Transaction", {"transaction_id": txn_data["transactionId"]})
    if existing:
        return
    
    # Get or create wallet
    wallet = get_or_create_wallet(txn_data["senderId"], txn_data.get("senderEmail"), txn_data.get("senderPhone"), txn_data.get("senderName"))
    
    doc = frappe.get_doc({
        "doctype": "PayEase Wallet Transaction",
        "transaction_id": txn_data["transactionId"],
        "wallet": wallet.name,
        "type": txn_data["type"],
        "status": "Completed" if txn_data["status"] == "completed" else txn_data["status"].capitalize(),
        "amount": txn_data["amount"],
        "currency": txn_data.get("currency", "INR"),
        "receiver_phone": txn_data.get("receiverPhone"),
        "receiver_upi_id": txn_data.get("receiverUpiId"),
        "receiver_name": txn_data.get("receiverName"),
        "payment_method": txn_data.get("paymentMethod", "wallet"),
        "description": txn_data.get("description"),
        "remark": txn_data.get("remark", ""),
        "category": txn_data.get("category", "other"),
        "completed_at": txn_data.get("completedAt") or now_datetime(),
        "reference_number": txn_data.get("referenceNumber"),
        "gateway_response": json.dumps(txn_data.get("metadata", {}))
    })
    
    doc.insert(ignore_permissions=True)
    
    # Trigger notification
    frappe.enqueue(
        "payease_erpnext.api.webhook_handler.send_transaction_notification",
        txn_doc=doc.name
    )

def get_or_create_wallet(user_id, email, phone, name):
    """Get or create wallet for user"""
    wallet_id = f"WAL-{user_id}"
    
    if frappe.db.exists("PayEase Wallet", wallet_id):
        return frappe.get_doc("PayEase Wallet", wallet_id)
    
    wallet = frappe.get_doc({
        "doctype": "PayEase Wallet",
        "wallet_id": wallet_id,
        "user_email": email,
        "user_phone": phone,
        "user_name": name,
        "balance": 0,
        "status": "Active"
    })
    wallet.insert(ignore_permissions=True)
    return wallet

def sync_wallet_balance(data):
    """Sync wallet balance from app"""
    wallet_id = f"WAL-{data['userId']}"
    if frappe.db.exists("PayEase Wallet", wallet_id):
        wallet = frappe.get_doc("PayEase Wallet", wallet_id)
        wallet.balance = data["balance"]
        wallet.last_transaction_at = now_datetime()
        wallet.save()

def log_failed_transaction(txn_data):
    """Log failed transaction for reconciliation"""
    frappe.get_doc({
        "doctype": "Error Log",
        "method": "PayEase Transaction Failed",
        "error": json.dumps(txn_data)
    }).insert(ignore_permissions=True)

def send_transaction_notification(txn_doc):
    """Send notification to user"""
    doc = frappe.get_doc("PayEase Wallet Transaction", txn_doc)
    
    notification = frappe.get_doc({
        "doctype": "PayEase Notification Log",
        "user": frappe.db.get_value("PayEase Wallet", doc.wallet, "user"),
        "title": f"Transaction {doc.status}: {doc.transaction_id}",
        "message": f"Your transaction of {doc.currency} {doc.amount} is {doc.status.lower()}. {doc.description or ''}",
        "type": "transaction",
        "sent_via": "app"
    })
    notification.insert(ignore_permissions=True)
```

---

### 2. Wallet API (`payease_erpnext/api/wallet.py`)

```python
import frappe
from frappe import _

@frappe.whitelist()
def get_wallet_balance(wallet_id):
    """Get wallet balance"""
    wallet = frappe.get_doc("PayEase Wallet", wallet_id)
    return {
        "wallet_id": wallet.name,
        "balance": wallet.balance,
        "currency": wallet.currency,
        "daily_limit": wallet.daily_limit,
        "monthly_limit": wallet.monthly_limit,
        "status": wallet.status,
        "kyc_status": wallet.kyc_status
    }

@frappe.whitelist()
def update_wallet_balance():
    """Update wallet balance (admin only)"""
    data = frappe.request.get_json()
    wallet = frappe.get_doc("PayEase Wallet", data["wallet_id"])
    wallet.balance = data["balance"]
    wallet.save()
    return {"status": "success", "new_balance": wallet.balance}

@frappe.whitelist()
def get_wallet_statement(wallet_id, from_date=None, to_date=None):
    """Get wallet statement with transactions"""
    filters = {
        "wallet": wallet_id,
        "status": "Completed"
    }
    
    if from_date:
        filters["creation">=] = from_date
    if to_date:
        filters["creation"<=] = to_date
    
    transactions = frappe.get_all(
        "PayEase Wallet Transaction",
        filters=filters,
        fields=["name", "transaction_id", "type", "amount", "description", "creation", "category"],
        order_by="creation desc"
    )
    
    wallet = frappe.get_doc("PayEase Wallet", wallet_id)
    
    return {
        "wallet_id": wallet_id,
        "current_balance": wallet.balance,
        "currency": wallet.currency,
        "transactions": transactions
    }

@frappe.whitelist()
def freeze_wallet(wallet_id, reason=None):
    """Freeze wallet for security"""
    wallet = frappe.get_doc("PayEase Wallet", wallet_id)
    wallet.status = "Suspended"
    wallet.save()
    
    # Create notification
    frappe.get_doc({
        "doctype": "PayEase Notification Log",
        "user": frappe.session.user,
        "title": "Wallet Frozen",
        "message": f"Your wallet has been frozen. Reason: {reason or 'Security concern'}",
        "type": "security"
    }).insert(ignore_permissions=True)
    
    return {"status": "success", "message": "Wallet frozen"}
```

---

### 3. Transaction API (`payease_erpnext/api/transaction.py`)

```python
import frappe
from frappe.utils import today, add_days

@frappe.whitelist()
def get_transaction_stats():
    """Get transaction statistics for dashboard"""
    
    # Today
    today_count = frappe.db.count("PayEase Wallet Transaction", {
        "creation": [">=", today()],
        "status": "Completed"
    })
    
    today_amount = frappe.db.sql("""
        SELECT COALESCE(SUM(amount), 0) 
        FROM `tabPayEase Wallet Transaction` 
        WHERE DATE(creation) = %s AND status = 'Completed'
    """, today())[0][0]
    
    # This month
    month_start = today().replace(day=1)
    month_amount = frappe.db.sql("""
        SELECT COALESCE(SUM(amount), 0) 
        FROM `tabPayEase Wallet Transaction` 
        WHERE creation >= %s AND status = 'Completed'
    """, month_start)[0][0]
    
    # By type
    by_type = frappe.db.sql("""
        SELECT type, COUNT(*) as count, SUM(amount) as total
        FROM `tabPayEase Wallet Transaction`
        WHERE status = 'Completed'
        GROUP BY type
    """, as_dict=True)
    
    return {
        "today": {"count": today_count, "amount": today_amount},
        "month": {"amount": month_amount},
        "by_type": by_type
    }

@frappe.whitelist()
def reconcile_transactions():
    """Reconcile pending transactions with bank/gateway"""
    pending = frappe.get_all(
        "PayEase Wallet Transaction",
        filters={"status": "Pending"},
        fields=["name", "transaction_id", "amount"]
    )
    
    reconciled = 0
    for txn in pending:
        # Check with payment gateway
        # gateway_status = check_gateway_status(txn.transaction_id)
        # if gateway_status == "success":
        #     frappe.db.set_value("PayEase Wallet Transaction", txn.name, "status", "Completed")
        #     reconciled += 1
        pass
    
    return {"status": "success", "reconciled": reconciled, "total_pending": len(pending)}

@frappe.whitelist()
def refund_transaction(transaction_id, reason=None):
    """Process refund for a transaction"""
    txn = frappe.get_doc("PayEase Wallet Transaction", {"transaction_id": transaction_id})
    
    if txn.status != "Completed":
        frappe.throw("Only completed transactions can be refunded")
    
    # Create refund transaction
    refund = frappe.get_doc({
        "doctype": "PayEase Wallet Transaction",
        "transaction_id": f"REF-{transaction_id}",
        "wallet": txn.wallet,
        "type": "refund",
        "status": "Completed",
        "amount": txn.amount,
        "currency": txn.currency,
        "description": f"Refund for {transaction_id}",
        "reference_number": transaction_id,
        "completed_at": frappe.utils.now_datetime()
    })
    refund.insert(ignore_permissions=True)
    
    # Reverse journal entry
    if txn.journal_entry:
        reverse_je = frappe.get_doc({
            "doctype": "Journal Entry",
            "voucher_type": "Journal Entry",
            "posting_date": today(),
            "accounts": [
                {
                    "account": "PayEase Wallet Control - _TC",
                    "debit_in_account_currency": txn.amount,
                    "credit_in_account_currency": 0
                },
                {
                    "account": "Miscellaneous Expenses - _TC",
                    "debit_in_account_currency": 0,
                    "credit_in_account_currency": txn.amount
                }
            ],
            "user_remark": f"Refund: {transaction_id}"
        })
        reverse_je.insert()
        reverse_je.submit()
    
    # Update original transaction
    frappe.db.set_value("PayEase Wallet Transaction", txn.name, "status", "Refunded")
    
    return {"status": "success", "refund_id": refund.name}
```

---

## Client Scripts

### Wallet Form Script (`payease_wallet.js`)

```javascript
frappe.ui.form.on('PayEase Wallet', {
    refresh(frm) {
        // Add custom buttons
        if (frm.doc.status === 'Active') {
            frm.add_custom_button(__('Freeze Wallet'), () => {
                frappe.confirm('Are you sure you want to freeze this wallet?', () => {
                    frappe.call({
                        method: 'payease_erpnext.api.wallet.freeze_wallet',
                        args: {
                            wallet_id: frm.doc.name,
                            reason: 'Manual freeze from ERPNext'
                        },
                        callback: (r) => {
                            if (r.message.status === 'success') {
                                frm.reload_doc();
                                frappe.show_alert('Wallet frozen successfully');
                            }
                        }
                    });
                });
            }, __('Actions'));
        }
        
        // View statement button
        frm.add_custom_button(__('View Statement'), () => {
            frappe.set_route('query-report', 'PayEase Transaction Report', {
                wallet: frm.doc.name
            });
        }, __('Actions'));
        
        // Dashboard link
        frm.dashboard.add_transactions([
            {
                'label': __('Transactions'),
                'items': ['PayEase Wallet Transaction']
            }
        ]);
    },
    
    validate(frm) {
        if (frm.doc.daily_limit > frm.doc.monthly_limit) {
            frappe.msgprint(__('Daily limit cannot exceed monthly limit'));
            frappe.validated = false;
        }
    }
});
```

### Transaction List Script (`payease_wallet_transaction_list.js`)

```javascript
frappe.listview_settings['PayEase Wallet Transaction'] = {
    get_indicator(doc) {
        const colors = {
            'Pending': 'orange',
            'Completed': 'green',
            'Failed': 'red',
            'Cancelled': 'gray',
            'Refunded': 'blue'
        };
        return [__(doc.status), colors[doc.status] || 'gray', 'status,=,' + doc.status];
    },
    
    onload(listview) {
        listview.page.add_menu_item(__('Bulk Reconcile'), () => {
            frappe.call({
                method: 'payease_erpnext.api.transaction.reconcile_transactions',
                callback: (r) => {
                    frappe.show_alert(`Reconciled ${r.message.reconciled} transactions`);
                    listview.refresh();
                }
            });
        });
        
        listview.page.add_menu_item(__('Export for GST'), () => {
            const filters = listview.get_filters_args();
            window.open(`/api/method/payease_erpnext.api.transaction.export_gst_report?${
                new URLSearchParams(filters)
            }`);
        });
    }
};
```

---

## Reports

### 1. PayEase Transaction Report (`payease_transaction_report.py`)

```python
import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    chart = get_chart_data(filters)
    return columns, data, None, chart

def get_columns():
    return [
        {"fieldname": "transaction_id", "label": _("Transaction ID"), "fieldtype": "Link", "options": "PayEase Wallet Transaction", "width": 180},
        {"fieldname": "creation", "label": _("Date"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "type", "label": _("Type"), "fieldtype": "Data", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "amount", "label": _("Amount"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "currency", "label": _("Currency"), "fieldtype": "Data", "width": 80},
        {"fieldname": "wallet", "label": _("Wallet"), "fieldtype": "Link", "options": "PayEase Wallet", "width": 120},
        {"fieldname": "receiver_name", "label": _("Receiver"), "fieldtype": "Data", "width": 150},
        {"fieldname": "category", "label": _("Category"), "fieldtype": "Data", "width": 100},
        {"fieldname": "payment_method", "label": _("Method"), "fieldtype": "Data", "width": 100},
        {"fieldname": "journal_entry", "label": _("Journal Entry"), "fieldtype": "Link", "options": "Journal Entry", "width": 150},
    ]

def get_data(filters):
    conditions = []
    values = {}
    
    if filters.get("from_date"):
        conditions.append("creation >= %(from_date)s")
        values["from_date"] = filters["from_date"]
    
    if filters.get("to_date"):
        conditions.append("creation <= %(to_date)s")
        values["to_date"] = filters["to_date"]
    
    if filters.get("wallet"):
        conditions.append("wallet = %(wallet)s")
        values["wallet"] = filters["wallet"]
    
    if filters.get("status"):
        conditions.append("status = %(status)s")
        values["status"] = filters["status"]
    
    if filters.get("type"):
        conditions.append("type = %(type)s")
        values["type"] = filters["type"]
    
    if filters.get("category"):
        conditions.append("category = %(category)s")
        values["category"] = filters["category"]
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return frappe.db.sql(f"""
        SELECT 
            transaction_id,
            creation,
            type,
            status,
            amount,
            currency,
            wallet,
            receiver_name,
            category,
            payment_method,
            journal_entry
        FROM `tabPayEase Wallet Transaction`
        WHERE {where_clause}
        ORDER BY creation DESC
    """, values, as_dict=True)

def get_chart_data(filters):
    data = frappe.db.sql("""
        SELECT 
            DATE(creation) as date,
            SUM(CASE WHEN type IN ('send_money', 'pay_bill', 'qr_payment') THEN amount ELSE 0 END) as outgoing,
            SUM(CASE WHEN type IN ('add_money', 'receive_money', 'refund') THEN amount ELSE 0 END) as incoming
        FROM `tabPayEase Wallet Transaction`
        WHERE status = 'Completed'
        AND creation >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(creation)
        ORDER BY date
    """, as_dict=True)
    
    return {
        "data": {
            "labels": [d.date.strftime("%d %b") for d in data],
            "datasets": [
                {"name": "Outgoing", "values": [d.outgoing for d in data]},
                {"name": "Incoming", "values": [d.incoming for d in data]}
            ]
        },
        "type": "bar",
        "colors": ["#EF4444", "#10B981"]
    }
```

**Report JSON:** `payease_transaction_report.json`

```json
{
  "add_total_row": 1,
  "columns": [],
  "creation": "2026-04-30 10:00:00.000000",
  "disable_prepared_report": 0,
  "disabled": 0,
  "docstatus": 0,
  "doctype": "Report",
  "filters": [
    {
      "fieldname": "from_date",
      "fieldtype": "Date",
      "label": "From Date",
      "wildcard_filter": 0
    },
    {
      "fieldname": "to_date",
      "fieldtype": "Date",
      "label": "To Date",
      "wildcard_filter": 0
    },
    {
      "fieldname": "wallet",
      "fieldtype": "Link",
      "label": "Wallet",
      "options": "PayEase Wallet",
      "wildcard_filter": 0
    },
    {
      "fieldname": "status",
      "fieldtype": "Select",
      "label": "Status",
      "options": "\nPending\nCompleted\nFailed\nCancelled\nRefunded",
      "wildcard_filter": 0
    },
    {
      "fieldname": "type",
      "fieldtype": "Select",
      "label": "Type",
      "options": "\nsend_money\nreceive_money\nadd_money\nwithdraw\npay_bill\nrecharge\nqr_payment\nrefund",
      "wildcard_filter": 0
    },
    {
      "fieldname": "category",
      "fieldtype": "Select",
      "label": "Category",
      "options": "\nfood\nshopping\ntravel\nentertainment\nbills\nrecharge\ntransfer\nother",
      "wildcard_filter": 0
    }
  ],
  "idx": 0,
  "is_standard": "Yes",
  "json": "{}",
  "modified": "2026-04-30 10:00:00.000000",
  "modified_by": "Administrator",
  "module": "PayEase",
  "name": "PayEase Transaction Report",
  "owner": "Administrator",
  "prepared_report": 0,
  "ref_doctype": "PayEase Wallet Transaction",
  "reference_report": "",
  "report_name": "PayEase Transaction Report",
  "report_type": "Script Report",
  "roles": [
    {
      "role": "System Manager"
    },
    {
      "role": "PayEase Admin"
    },
    {
      "role": "PayEase Support"
    }
  ]
}
```

---

### 2. PayEase Wallet Summary (`payease_wallet_summary.py`)

```python
import frappe
from frappe import _

def execute(filters=None):
    columns = [
        {"fieldname": "wallet_id", "label": _("Wallet ID"), "fieldtype": "Link", "options": "PayEase Wallet", "width": 150},
        {"fieldname": "user_name", "label": _("User Name"), "fieldtype": "Data", "width": 150},
        {"fieldname": "user_email", "label": _("Email"), "fieldtype": "Data", "width": 180},
        {"fieldname": "balance", "label": _("Balance"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "currency", "label": _("Currency"), "fieldtype": "Data", "width": 80},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "kyc_status", "label": _("KYC"), "fieldtype": "Data", "width": 100},
        {"fieldname": "total_transactions", "label": _("Txns"), "fieldtype": "Int", "width": 80},
        {"fieldname": "daily_limit", "label": _("Daily Limit"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "monthly_limit", "label": _("Monthly Limit"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "last_transaction_at", "label": _("Last Active"), "fieldtype": "Datetime", "width": 150},
    ]
    
    conditions = "1=1"
    if filters and filters.get("status"):
        conditions += f" AND status = '{filters.get('status')}'"
    
    data = frappe.db.sql(f"""
        SELECT 
            name as wallet_id,
            user_name,
            user_email,
            balance,
            currency,
            status,
            kyc_status,
            total_transactions,
            daily_limit,
            monthly_limit,
            last_transaction_at
        FROM `tabPayEase Wallet`
        WHERE {conditions}
        ORDER BY balance DESC
    """, as_dict=True)
    
    # Summary row
    total_balance = sum(d.balance for d in data)
    
    return columns, data, None, None
```

---

### 3. PayEase Daily Settlement (`payease_daily_settlement.py`)

```python
import frappe
from frappe import _
from frappe.utils import today, getdate

def execute(filters=None):
    settlement_date = filters.get("settlement_date") if filters else today()
    
    columns = [
        {"fieldname": "merchant", "label": _("Merchant"), "fieldtype": "Link", "options": "PayEase Merchant", "width": 150},
        {"fieldname": "total_txns", "label": _("Transactions"), "fieldtype": "Int", "width": 100},
        {"fieldname": "gross_amount", "label": _("Gross Amount"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "commission", "label": _("Commission"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "net_amount", "label": _("Net Amount"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
    ]
    
    data = frappe.db.sql("""
        SELECT 
            m.name as merchant,
            COUNT(t.name) as total_txns,
            SUM(t.amount) as gross_amount,
            SUM(t.amount * m.commission_rate / 100) as commission,
            SUM(t.amount * (100 - m.commission_rate) / 100) as net_amount,
            'Pending' as status
        FROM `tabPayEase Merchant` m
        LEFT JOIN `tabPayEase Wallet Transaction` t ON t.receiver_upi_id = m.upi_id
        WHERE t.status = 'Completed'
        AND DATE(t.creation) = %s
        AND t.type = 'qr_payment'
        GROUP BY m.name
    """, (settlement_date,), as_dict=True)
    
    return columns, data
```

---

## Workspaces

### PayEase Workspace (`payease.json`)

```json
{
  "charts": [
    {
      "chart_name": "PayEase Daily Transactions",
      "label": "Daily Transactions"
    },
    {
      "chart_name": "PayEase Wallet Balance Distribution",
      "label": "Wallet Balances"
    }
  ],
  "creation": "2026-04-30 10:00:00.000000",
  "custom_blocks": [],
  "docstatus": 0,
  "doctype": "Workspace",
  "for_user": "",
  "hide_custom": 0,
  "icon": "wallet",
  "is_hidden": 0,
  "label": "PayEase",
  "links": [
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Wallets",
      "link_count": 0,
      "link_to": "PayEase Wallet",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Transactions",
      "link_count": 0,
      "link_to": "PayEase Wallet Transaction",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Beneficiaries",
      "link_count": 0,
      "link_to": "PayEase Beneficiary",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Merchants",
      "link_count": 0,
      "link_to": "PayEase Merchant",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Bill Payments",
      "link_count": 0,
      "link_to": "PayEase Bill Payment",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Offers",
      "link_count": 0,
      "link_to": "PayEase Offer",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "Notifications",
      "link_count": 0,
      "link_to": "PayEase Notification Log",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 0,
      "label": "QR Codes",
      "link_count": 0,
      "link_to": "PayEase QR Code",
      "link_type": "DocType",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 1,
      "label": "Transaction Report",
      "link_count": 0,
      "link_to": "PayEase Transaction Report",
      "link_type": "Report",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 1,
      "label": "Wallet Summary",
      "link_count": 0,
      "link_to": "PayEase Wallet Summary",
      "link_type": "Report",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 1,
      "label": "Daily Settlement",
      "link_count": 0,
      "link_to": "PayEase Daily Settlement",
      "link_type": "Report",
      "onboard": 0,
      "type": "Link"
    },
    {
      "hidden": 0,
      "is_query_report": 1,
      "label": "Merchant Payout",
      "link_count": 0,
      "link_to": "PayEase Merchant Payout",
      "link_type": "Report",
      "onboard": 0,
      "type": "Link"
    }
  ],
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase",
  "number_cards": [
    {
      "label": "Total Active Wallets",
      "number_card_name": "Total Active Wallets"
    },
    {
      "label": "Today's Transactions",
      "number_card_name": "Today's Transactions"
    },
    {
      "label": "Pending KYC",
      "number_card_name": "Pending KYC"
    },
    {
      "label": "Failed Transactions",
      "number_card_name": "Failed Transactions Today"
    }
  ],
  "parent_page": "",
  "public": 1,
  "quick_lists": [],
  "roles": [
    {
      "role": "System Manager"
    },
    {
      "role": "PayEase Admin"
    },
    {
      "role": "PayEase Support"
    }
  ],
  "sequence_id": 1.0,
  "shortcuts": [
    {
      "color": "Grey",
      "doc_view": "List",
      "format": "{{ balance }}",
      "label": "Top Wallets",
      "link_to": "PayEase Wallet",
      "stats_filter": "[[\"PayEase Wallet\",\"status\",\"=\",\"Active\"]]",
      "type": "DocType"
    },
    {
      "color": "Blue",
      "doc_view": "List",
      "label": "Pending Transactions",
      "link_to": "PayEase Wallet Transaction",
      "stats_filter": "[[\"PayEase Wallet Transaction\",\"status\",\"=\",\"Pending\"]]",
      "type": "DocType"
    },
    {
      "color": "Green",
      "doc_view": "List",
      "label": "Active Offers",
      "link_to": "PayEase Offer",
      "stats_filter": "[[\"PayEase Offer\",\"is_active\",\"=\",\"1\"]]",
      "type": "DocType"
    }
  ],
  "title": "PayEase"
}
```

---

## Notifications

### 1. Low Balance Alert (`low_balance_alert.json`)

```json
{
  "attach_print": 0,
  "channel": "Email",
  "channel_id": "",
  "condition": "doc.balance < 500",
  "creation": "2026-04-30 10:00:00.000000",
  "days_in_advance": 0,
  "docstatus": 0,
  "doctype": "Notification",
  "document_type": "PayEase Wallet",
  "enabled": 1,
  "event": "Value Change",
  "is_standard": 1,
  "message": "<p>Your PayEase wallet balance is low.</p><p>Current Balance: {{ doc.currency }} {{ doc.balance }}</p><p>Please add money to continue using our services.</p>",
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "Low Balance Alert",
  "print_format": "",
  "property_value": "",
  "recipients": [
    {
      "receiver_by_document_field": "user_email",
      "receiver_by_role": ""
    }
  ],
  "send_system_notification": 1,
  "send_to_all_assignees": 0,
  "sender": "",
  "sender_email": "",
  "set_property_after_alert": "",
  "slack_webhook_url": "",
  "subject": "PayEase: Low Wallet Balance Alert - {{ doc.wallet_id }}",
  "value_changed": "balance"
}
```

---

### 2. Large Transaction Alert (`large_transaction_alert.json`)

```json
{
  "attach_print": 0,
  "channel": "Email",
  "channel_id": "",
  "condition": "doc.amount > 10000",
  "creation": "2026-04-30 10:00:00.000000",
  "days_in_advance": 0,
  "docstatus": 0,
  "doctype": "Notification",
  "document_type": "PayEase Wallet Transaction",
  "enabled": 1,
  "event": "New",
  "is_standard": 1,
  "message": "<p>A large transaction has been initiated on your PayEase wallet.</p><p>Transaction ID: {{ doc.transaction_id }}</p><p>Amount: {{ doc.currency }} {{ doc.amount }}</p><p>Type: {{ doc.type }}</p><p>If you did not authorize this transaction, please contact support immediately.</p>",
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "Large Transaction Alert",
  "print_format": "",
  "property_value": "",
  "recipients": [
    {
      "receiver_by_document_field": "owner",
      "receiver_by_role": ""
    }
  ],
  "send_system_notification": 1,
  "send_to_all_assignees": 0,
  "sender": "",
  "sender_email": "",
  "set_property_after_alert": "",
  "slack_webhook_url": "",
  "subject": "PayEase: Large Transaction Alert - {{ doc.amount }}",
  "value_changed": ""
}
```

---

### 3. Transaction Failed Alert (`transaction_failed_alert.json`)

```json
{
  "attach_print": 0,
  "channel": "Email",
  "channel_id": "",
  "condition": "doc.status == 'Failed'",
  "creation": "2026-04-30 10:00:00.000000",
  "days_in_advance": 0,
  "docstatus": 0,
  "doctype": "Notification",
  "document_type": "PayEase Wallet Transaction",
  "enabled": 1,
  "event": "Value Change",
  "is_standard": 1,
  "message": "<p>Your transaction has failed.</p><p>Transaction ID: {{ doc.transaction_id }}</p><p>Amount: {{ doc.currency }} {{ doc.amount }}</p><p>Reason: {{ doc.failure_reason or 'Unknown error' }}</p><p>Please try again or contact support if the issue persists.</p>",
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "Transaction Failed Alert",
  "print_format": "",
  "property_value": "",
  "recipients": [
    {
      "receiver_by_document_field": "owner",
      "receiver_by_role": ""
    }
  ],
  "send_system_notification": 1,
  "send_to_all_assignees": 0,
  "sender": "",
  "sender_email": "",
  "set_property_after_alert": "",
  "slack_webhook_url": "",
  "subject": "PayEase: Transaction Failed - {{ doc.transaction_id }}",
  "value_changed": "status"
}
```

---

## REST API Integration

### ERPNext REST API Endpoints for PayEase

#### 1. Create Wallet
```http
POST /api/resource/PayEase Wallet
Content-Type: application/json
Authorization: token api_key:api_secret

{
  "wallet_id": "WAL-12345",
  "user_email": "user@example.com",
  "user_phone": "+919876543210",
  "user_name": "John Doe",
  "balance": 0,
  "currency": "INR",
  "daily_limit": 50000,
  "monthly_limit": 500000,
  "status": "Active",
  "kyc_status": "Pending"
}
```

#### 2. Get Wallet
```http
GET /api/resource/PayEase Wallet/WAL-12345
Authorization: token api_key:api_secret
```

#### 3. Create Transaction
```http
POST /api/resource/PayEase Wallet Transaction
Content-Type: application/json
Authorization: token api_key:api_secret

{
  "transaction_id": "TXN2026ABC123",
  "wallet": "WAL-12345",
  "type": "send_money",
  "status": "Pending",
  "amount": 1500.00,
  "currency": "INR",
  "receiver_phone": "+919876543211",
  "receiver_name": "Jane Doe",
  "payment_method": "wallet",
  "description": "Payment for dinner",
  "category": "food"
}
```

#### 4. Update Transaction Status
```http
PUT /api/resource/PayEase Wallet Transaction/TXN2026ABC123
Content-Type: application/json
Authorization: token api_key:api_secret

{
  "status": "Completed",
  "completed_at": "2026-04-30 14:30:00",
  "reference_number": "BANKREF123456"
}
```

#### 5. Query Transaction Report
```http
GET /api/query-report/PayEase Transaction Report?filters={"from_date":"2026-04-01","to_date":"2026-04-30","status":"Completed"}
Authorization: token api_key:api_secret
```

#### 6. Webhook Endpoint (from PayEase App to ERPNext)
```http
POST /api/method/payease_erpnext.api.webhook_handler.handle_transaction_webhook
Content-Type: application/json
X-PayEase-Signature: sha256=<hmac_signature>

{
  "event": "transaction.completed",
  "timestamp": "2026-04-30T14:30:00Z",
  "transaction": {
    "transactionId": "TXN2026ABC123",
    "senderId": 12345,
    "senderEmail": "user@example.com",
    "senderPhone": "+919876543210",
    "senderName": "John Doe",
    "type": "send_money",
    "status": "completed",
    "amount": 1500.00,
    "currency": "INR",
    "receiverPhone": "+919876543211",
    "receiverName": "Jane Doe",
    "paymentMethod": "wallet",
    "description": "Payment for dinner",
    "category": "food",
    "completedAt": "2026-04-30T14:30:00Z",
    "metadata": {}
  }
}
```

---

## Print Formats

### PayEase Receipt (`payease_receipt.json`)

```json
{
  "align": "Left",
  "creation": "2026-04-30 10:00:00.000000",
  "custom_format": 1,
  "default_print_language": "en",
  "disabled": 0,
  "doc_type": "PayEase Wallet Transaction",
  "docstatus": 0,
  "doctype": "Print Format",
  "font": "Default",
  "format_data": "[{\"fieldname\": \"print_heading_template\", \"fieldtype\": \"Custom HTML\", \"options\": \"<div class=\\\"print-heading\\\"><h2>PayEase Receipt</h2></div>\"}, {\"fieldname\": \"transaction_id\", \"print_hide\": 0}, {\"fieldname\": \"creation\", \"print_hide\": 0}, {\"fieldname\": \"type\", \"print_hide\": 0}, {\"fieldname\": \"amount\", \"print_hide\": 0}, {\"fieldname\": \"currency\", \"print_hide\": 0}, {\"fieldname\": \"receiver_name\", \"print_hide\": 0}, {\"fieldname\": \"description\", \"print_hide\": 0}]",
  "html": "<div class=\"receipt-container\" style=\"max-width: 400px; margin: 0 auto; font-family: monospace;\">\n  <div style=\"text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;\">\n    <h2 style=\"margin: 0;\">PayEase</h2>\n    <p style=\"margin: 5px 0;\">Digital Payment Receipt</p>\n  </div>\n  <table style=\"width: 100%;\">\n    <tr><td>Transaction ID:</td><td style=\"text-align: right;\">{{ doc.transaction_id }}</td></tr>\n    <tr><td>Date:</td><td style=\"text-align: right;\">{{ frappe.format_date(doc.creation, \"dd MMM yyyy HH:mm\") }}</td></tr>\n    <tr><td>Type:</td><td style=\"text-align: right;\">{{ doc.type.replace('_', ' ').title() }}</td></tr>\n    <tr><td>Status:</td><td style=\"text-align: right;\">{{ doc.status }}</td></tr>\n    <tr><td colspan=\"2\" style=\"border-top: 1px solid #000;\"></td></tr>\n    <tr><td><strong>Amount:</strong></td><td style=\"text-align: right;\"><strong>{{ doc.currency }} {{ \"%.2f\"|format(doc.amount) }}</strong></td></tr>\n    <tr><td colspan=\"2\" style=\"border-top: 1px solid #000;\"></td></tr>\n    <tr><td>Receiver:</td><td style=\"text-align: right;\">{{ doc.receiver_name or '-' }}</td></tr>\n    <tr><td>Phone:</td><td style=\"text-align: right;\">{{ doc.receiver_phone or '-' }}</td></tr>\n    <tr><td>Method:</td><td style=\"text-align: right;\">{{ doc.payment_method.upper() }}</td></tr>\n    <tr><td>Description:</td><td style=\"text-align: right;\">{{ doc.description or '-' }}</td></tr>\n  </table>\n  <div style=\"text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px;\">\n    <p style=\"font-size: 10px;\">Thank you for using PayEase!</p>\n    <p style=\"font-size: 9px;\">For support: support@payease.com</p>\n  </div>\n</div>",
  "line_breaks": 0,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Receipt",
  "owner": "Administrator",
  "print_format_builder": 0,
  "print_format_type": "Jinja",
  "raw_commands": "",
  "raw_printing": 0,
  "show_section_headings": 0,
  "standard": "Yes"
}
```

---

## Dashboard Charts

### 1. PayEase Daily Transactions

```python
# Number Card: Total Active Wallets
# DocType: Number Card
{
  "aggregate_function_based_on": "name",
  "color": "#29CD42",
  "docstatus": 0,
  "doctype": "Number Card",
  "document_type": "PayEase Wallet",
  "filters_config": "[]",
  "filters_json": "[[\"PayEase Wallet\",\"status\",\"=\",\"Active\"]]",
  "function": "Count",
  "is_public": 1,
  "is_standard": 1,
  "label": "Total Active Wallets",
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "Total Active Wallets",
  "owner": "Administrator",
  "show_percentage_stats": 1,
  "stats_filter": "[[\"PayEase Wallet\",\"status\",\"=\",\"Active\"]]"
}
```

### 2. Chart: Daily Transaction Volume

```json
{
  "chart_name": "PayEase Daily Transactions",
  "chart_type": "Sum",
  "color": "#31870C",
  "creation": "2026-04-30 10:00:00.000000",
  "docstatus": 0,
  "doctype": "Dashboard Chart",
  "document_type": "PayEase Wallet Transaction",
  "dynamic_filters_json": "[]",
  "filters_json": "[[\"PayEase Wallet Transaction\",\"status\",\"=\",\"Completed\"]]",
  "group_by_type": "Count",
  "is_public": 1,
  "is_standard": 1,
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Daily Transactions",
  "number_of_groups": 0,
  "owner": "Administrator",
  "time_interval": "Daily",
  "timeseries": 1,
  "timespan": "Last Month",
  "type": "Bar",
  "use_report_chart": 0,
  "x_field": "",
  "y_axis": [
    {
      "color": "#31870C",
      "y_field": "amount"
    }
  ]
}
```

---

## Webhooks

### ERPNext Webhook Configuration for PayEase

```json
{
  "condition": "doc.status == 'Completed'",
  "creation": "2026-04-30 10:00:00.000000",
  "docstatus": 0,
  "doctype": "Webhook",
  "enabled": 1,
  "field": "status",
  "condition": "doc.status == 'Completed'",
  "hook_based_on": "DocType Event",
  "is_json": 1,
  "mechanism": "POST",
  "modified": "2026-04-30 10:00:00.000000",
  "module": "PayEase",
  "name": "PayEase Transaction Completed",
  "owner": "Administrator",
  "request_body": [
    {
      "fieldname": "event",
      "key": "event"
    },
    {
      "fieldname": "transaction_id",
      "key": "transaction_id"
    },
    {
      "fieldname": "amount",
      "key": "amount"
    },
    {
      "fieldname": "type",
      "key": "type"
    },
    {
      "fieldname": "wallet",
      "key": "wallet"
    }
  ],
  "request_structure": "Form URL-Encoded",
  "request_url": "https://payease.app/api/webhook/erpnext",
  "webhook_data": [
    {
      "fieldname": "event",
      "key": "event",
      "value": "transaction.completed"
    }
  ],
  "webhook_doctype": "PayEase Wallet Transaction",
  "webhook_headers": [
    {
      "key": "Content-Type",
      "value": "application/json"
    },
    {
      "key": "X-ERPNext-Secret",
      "value": "your-webhook-secret"
    }
  ]
}
```

---

## Roles & Permissions

### Custom Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| PayEase Admin | Full access to PayEase module | Create, Read, Write, Delete, Report |
| PayEase Support | Read-only + limited write | Read, Report, limited Write |
| PayEase Merchant | Merchant dashboard access | Read own data, transactions |
| PayEase KYC Agent | KYC verification access | Read, Write KYC fields |

### Role Setup Script

```python
import frappe

def setup_payease_roles():
    roles = [
        {"role_name": "PayEase Admin", "desk_access": 1},
        {"role_name": "PayEase Support", "desk_access": 1},
        {"role_name": "PayEase Merchant", "desk_access": 1},
        {"role_name": "PayEase KYC Agent", "desk_access": 1}
    ]
    
    for role_data in roles:
        if not frappe.db.exists("Role", role_data["role_name"]):
            role = frappe.get_doc({
                "doctype": "Role",
                "role_name": role_data["role_name"],
                "desk_access": role_data["desk_access"]
            })
            role.insert()
    
    frappe.db.commit()
```

---

## Git Repository Structure

### Repository: `payease-erpnext`

```bash
# Initialize repository
git init payease-erpnext
cd payease-erpnext

# Create directory structure
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_wallet
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_wallet_transaction
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_beneficiary
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_merchant
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_bill_payment
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_notification_log
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_offer
mkdir -p payease_erpnext/payease_erpnext/doctype/payease_qr_code
mkdir -p payease_erpnext/payease_erpnext/report/payease_transaction_report
mkdir -p payease_erpnext/payease_erpnext/report/payease_wallet_summary
mkdir -p payease_erpnext/payease_erpnext/report/payease_daily_settlement
mkdir -p payease_erpnext/payease_erpnext/report/payease_merchant_payout
mkdir -p payease_erpnext/payease_erpnext/workspace/payease
mkdir -p payease_erpnext/payease_erpnext/notification/low_balance_alert
mkdir -p payease_erpnext/payease_erpnext/notification/large_transaction_alert
mkdir -p payease_erpnext/payease_erpnext/notification/transaction_failed_alert
mkdir -p payease_erpnext/payease_erpnext/print_format/payease_receipt
mkdir -p payease_erpnext/payease_erpnext/print_format/payease_statement
mkdir -p payease_erpnext/payease_erpnext/api
mkdir -p payease_erpnext/payease_erpnext/config

# .gitignore
cat > .gitignore << 'EOF'
*.pyc
__pycache__/
*.swp
*.swo
*~
.DS_Store
.env
EOF

# Initial commit
git add .
git commit -m "feat: Initial PayEase ERPNext integration module"
```

---

## Installation & Setup

### Step 1: Install Frappe Bench

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y python3-dev python3-pip python3-setuptools python3-venv
sudo apt-get install -y software-properties-common mariadb-server mariadb-client
sudo apt-get install -y redis-server libmysqlclient-dev

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install yarn
npm install -g yarn

# Install bench
pip3 install frappe-bench

# Initialize bench
bench init --frappe-branch version-15 frappe-bench
cd frappe-bench
```

### Step 2: Create New Site

```bash
bench new-site payease.local
bench --site payease.local enable-scheduler
bench --site payease.local set-maintenance-mode off
```

### Step 3: Install PayEase App

```bash
# Get the PayEase app
cd apps
git clone https://github.com/your-org/payease-erpnext.git
cd ../

# Install app
bench --site payease.local install-app payease_erpnext

# Migrate
bench --site payease.local migrate

# Restart
bench restart
```

### Step 4: Configure PayEase Settings

```python
# Run via bench console or create a setup script
bench --site payease.local console

# In console:
settings = frappe.get_doc({
    "doctype": "PayEase Settings",
    "wallet_control_account": "PayEase Wallet Control - PEE",
    "bank_account": "HDFC Bank - PEE",
    "default_commission_account": "Commission Income - PEE",
    "webhook_secret": "your-secure-webhook-secret-key",
    "api_key": "your-api-key",
    "api_secret": "your-api-secret"
})
settings.insert()
```

### Step 5: Configure ERPNext Accounts

```bash
# Create required accounts in Chart of Accounts
# Go to: Accounts > Chart of Accounts

# Create under Application of Funds (Assets):
# - PayEase Wallet Control Account (Asset)

# Create under Expenses:
# - PayEase Commission Expense
# - PayEase Convenience Fee Expense

# Create under Income:
# - PayEase Commission Income
```

### Step 6: Setup Webhooks in PayEase App

In your PayEase app `.env` file:

```env
# ERPNext Integration
ERPNEXT_BASE_URL=https://erp.yourcompany.com
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
ERPNEXT_WEBHOOK_SECRET=your_webhook_secret
```

### Step 7: Assign Roles

```bash
bench --site payease.local add-user payease-admin@company.com --role PayEase Admin
bench --site payease.local add-user payease-support@company.com --role PayEase Support
```

---

## Integration Checklist

- [ ] Install Frappe Bench V15+
- [ ] Create and configure new site
- [ ] Install `payease_erpnext` app
- [ ] Run database migration
- [ ] Configure Chart of Accounts (Wallet Control, Commission accounts)
- [ ] Set up PayEase Settings (accounts, webhooks, API keys)
- [ ] Configure payment gateway accounts
- [ ] Create custom roles (PayEase Admin, Support, Merchant, KYC Agent)
- [ ] Set up email templates for notifications
- [ ] Configure webhook endpoint in PayEase app
- [ ] Test transaction flow end-to-end
- [ ] Set up scheduled job for daily settlement
- [ ] Configure backup for PayEase data
- [ ] Set up monitoring and alerts
- [ ] Enable audit logging for all financial transactions
- [ ] Test GST reporting for applicable transactions
- [ ] Train operations team on PayEase workspace

---

## License

MIT License - PayEase ERPNext Integration Module

---

## Support

For issues and feature requests related to the ERPNext integration:
- GitHub Issues: `https://github.com/your-org/payease-erpnext/issues`
- Email: `erpnext-support@payease.com`
- Documentation: `https://docs.payease.com/erpnext`

---

*This integration guide is designed for ERPNext V15+ and Frappe Framework V15+. Ensure your bench environment is up to date before installation.*
