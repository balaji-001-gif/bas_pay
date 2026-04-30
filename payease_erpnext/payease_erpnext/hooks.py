app_name = "payease_erpnext"
app_title = "PayEase ERPNext"
app_publisher = "PayEase"
app_description = "PayEase Mobile Payment Integration for ERPNext"
app_email = "support@payease.com"
app_license = "MIT"

# Fixtures
fixtures = [
    "Custom Field",
    "Property Setter",
    "PayEase Settings",
    "Role",
    "Notification",
    "Dashboard Chart"
]

# DocTypes
doctype_js = {
    "PayEase Wallet": "payease_erpnext/doctype/payease_wallet/payease_wallet.js",
    "PayEase Wallet Transaction": "payease_erpnext/doctype/payease_wallet_transaction/payease_wallet_transaction.js"
}

# Scheduler events
scheduler_events = {
    "daily": [
        "payease_erpnext.api.transaction.process_daily_settlement"
    ]
}
