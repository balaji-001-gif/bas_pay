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