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