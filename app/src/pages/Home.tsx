import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Send,
  QrCode,
  ArrowDownLeft,
  CreditCard,
  Smartphone,
  Wifi,
  Tv,
  Droplets,
  Flame,
  Bolt,
  Landmark,
  ShoppingBag,
  TicketPercent,
  Bell,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions = [
  { icon: Send, label: "Send", path: "/send", color: "bg-blue-500" },
  { icon: QrCode, label: "Scan", path: "/scan", color: "bg-emerald-500" },
  { icon: ArrowDownLeft, label: "Request", path: "/send?tab=request", color: "bg-amber-500" },
  { icon: CreditCard, label: "Add Money", path: "/add-money", color: "bg-violet-500" },
];

const serviceActions = [
  { icon: Smartphone, label: "Recharge", path: "/bills?cat=mobile", color: "bg-rose-500" },
  { icon: Wifi, label: "Broadband", path: "/bills?cat=broadband", color: "bg-cyan-500" },
  { icon: Tv, label: "DTH", path: "/bills?cat=dth", color: "bg-indigo-500" },
  { icon: Droplets, label: "Water", path: "/bills?cat=water", color: "bg-sky-500" },
  { icon: Flame, label: "Gas", path: "/bills?cat=gas", color: "bg-orange-500" },
  { icon: Bolt, label: "Electricity", path: "/bills?cat=electricity", color: "bg-yellow-500" },
  { icon: Landmark, label: "Insurance", path: "/bills?cat=insurance", color: "bg-teal-500" },
  { icon: ShoppingBag, label: "Shopping", path: "/offers", color: "bg-pink-500" },
];

export default function Home() {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  const { data: wallet, isLoading: walletLoading } = trpc.wallet.getWallet.useQuery();
  const { data: txns, isLoading: txnLoading } = trpc.transaction.getHistory.useQuery({ limit: 5 });
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();
  const { data: stats } = trpc.wallet.stats.useQuery();

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-5 pt-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs text-blue-100">Welcome back</p>
              <p className="text-sm font-semibold">{user?.name || "User"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/offers" className="relative p-2">
              <TicketPercent className="w-5 h-5" />
            </Link>
            <Link to="/notifications" className="relative p-2">
              <Bell className="w-5 h-5" />
              {unreadCount ? (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-200" />
              <span className="text-xs text-blue-100">Wallet Balance</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:bg-white/10 rounded"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {walletLoading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : showBalance ? (
              <>₹{wallet?.balance || "0.00"}</>
            ) : (
              "****"
            )}
          </p>
          {stats && (
            <p className="text-xs text-blue-200 mt-1">
              Daily limit: ₹{stats.dailySpent} / {stats.dailyLimit}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2"
            >
              <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Services</h3>
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-4 gap-4">
          {serviceActions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="flex flex-col items-center gap-2"
            >
              <div className={`${action.color} w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm`}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-blue-600 font-medium">
            View All
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {txnLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !txns?.length ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {txns.map((txn) => (
                <div key={txn.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      txn.direction === "incoming"
                        ? "bg-emerald-500"
                        : txn.type === "add_money"
                        ? "bg-blue-500"
                        : txn.type === "pay_bill"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  >
                    {txn.direction === "incoming"
                      ? "R"
                      : txn.type === "add_money"
                      ? "A"
                      : txn.type === "pay_bill"
                      ? "B"
                      : "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {txn.description}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {txn.createdAt
                        ? new Date(txn.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        txn.direction === "incoming"
                          ? "text-emerald-600"
                          : txn.type === "add_money"
                          ? "text-blue-600"
                          : "text-slate-800"
                      }`}
                    >
                      {txn.direction === "incoming" ? "+" : txn.type === "add_money" ? "+" : "-"}
                      ₹{txn.amount}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{txn.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
