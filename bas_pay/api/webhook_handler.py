import frappe
import json
from frappe.utils import now_datetime

@frappe.whitelist(allow_guest=True)
def handle_transaction_webhook():
    """
    Receives transaction webhook from PayEase app
    Endpoint: /api/method/bas_pay.api.webhook_handler.handle_transaction_webhook
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
        "bas_pay.api.webhook_handler.send_transaction_notification",
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