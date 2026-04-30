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