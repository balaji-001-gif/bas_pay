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
