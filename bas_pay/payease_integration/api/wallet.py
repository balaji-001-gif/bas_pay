import frappe
from frappe.utils import now_datetime

@frappe.whitelist()
def get_wallet_balance(user_id):
	return frappe.db.get_value('PayEase Wallet', {'user': user_id}, 'balance')
