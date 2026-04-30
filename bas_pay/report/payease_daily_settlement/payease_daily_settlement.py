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