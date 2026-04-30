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