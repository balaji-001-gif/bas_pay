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