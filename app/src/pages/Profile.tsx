import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Wallet,
  Receipt,
  Star,
  MapPin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: wallet } = trpc.wallet.getWallet.useQuery();
  const { data: stats } = trpc.transaction.getStats.useQuery();

  const menuItems = [
    { icon: Wallet, label: "My Wallet", path: "/add-money", value: `₹${wallet?.balance || "0.00"}` },
    { icon: Receipt, label: "Transaction History", path: "/transactions" },
    { icon: Star, label: "Saved Beneficiaries", path: "/send" },
    { icon: CreditCard, label: "Payment Methods", path: "#" },
    { icon: Shield, label: "Security & PIN", path: "#" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: MapPin, label: "Addresses", path: "#" },
    { icon: HelpCircle, label: "Help & Support", path: "#" },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Profile</h1>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-blue-200">{user?.phone || user?.email || "—"}</p>
              <div className="flex gap-4 mt-2 text-xs text-blue-200">
                <span>{stats?.totalTransactions || 0} Transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
              </div>
              {item.value && (
                <span className="text-sm font-semibold text-blue-600">{item.value}</span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full mt-4 h-12 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => {
            logout();
            toast.success("Logged out successfully");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        <p className="text-center text-xs text-slate-400 mt-6">
          PayEase v1.0.0
        </p>
      </div>
    </div>
  );
}
