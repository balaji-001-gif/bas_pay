import frappe

@frappe.whitelist()
def get_recent_transactions(wallet_id, limit=10):
	return frappe.get_all('PayEase Wallet Transaction', filters={'wallet': wallet_id}, fields=['*'], limit=limit, order_by='completed_at desc')
