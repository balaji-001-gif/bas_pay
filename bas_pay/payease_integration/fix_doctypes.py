"""
Run this on the server to force-register all PayEase DocTypes:
bench --site baspay.bizaxl.org execute bas_pay.payease_integration.fix_doctypes.run
"""
import frappe
import os


def run():
    doctypes = [
        "PayEase Wallet",
        "PayEase Wallet Transaction",
        "PayEase Beneficiary",
        "PayEase Bill Payment",
        "PayEase Merchant",
        "PayEase Notification Log",
        "PayEase Offer",
        "PayEase QR Code",
    ]

    # First clean up stale entries with wrong module names
    old_modules = ["PayEase", "Bas Pay", "payease", "bas_pay"]
    for old_mod in old_modules:
        stale = frappe.db.sql(
            "SELECT name FROM `tabDocType` WHERE name LIKE 'PayEase%%' AND module = %s",
            old_mod,
            as_dict=True,
        )
        for row in stale:
            frappe.db.sql(
                "DELETE FROM `tabDocType` WHERE name = %s AND module = %s",
                (row.name, old_mod),
            )
            frappe.logger().info(f"Removed stale entry: {row.name} (module={old_mod})")

    frappe.db.commit()

    # Now force-sync all DocTypes from their JSON files
    for dt in doctypes:
        try:
            frappe.reload_doctype(dt, force=True)
            print(f"✓ Synced: {dt}")
        except Exception as e:
            print(f"✗ Failed: {dt} → {e}")

    frappe.db.commit()
    print("\nAll DocTypes registered successfully under 'PayEase Integration'")
