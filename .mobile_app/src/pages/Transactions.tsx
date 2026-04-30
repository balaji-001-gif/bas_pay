import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Receipt,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "send_money" | "receive_money" | "add_money" | "pay_bill";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "send_money", label: "Sent" },
  { key: "receive_money", label: "Received" },
  { key: "add_money", label: "Added" },
  { key: "pay_bill", label: "Bills" },
];

function getIcon(type: string, direction: string) {
  if (direction === "incoming") return ArrowDownLeft;
  if (type === "add_money") return Wallet;
  if (type === "pay_bill" || type === "recharge") return Receipt;
  return ArrowUpRight;
}

function getIconBg(type: string, direction: string) {
  if (direction === "incoming") return "bg-emerald-500";
  if (type === "add_money") return "bg-blue-500";
  if (type === "pay_bill") return "bg-amber-500";
  if (type === "recharge") return "bg-rose-500";
  return "bg-rose-500";
}

export default function Transactions() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { data: txns, isLoading } = trpc.transaction.getHistory.useQuery({
    type: activeFilter === "all" ? undefined : activeFilter,
    limit: 50,
  });
  const { data: stats } = trpc.transaction.getStats.useQuery();

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Transactions</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
          <p className="text-xs text-blue-100 mb-3">This Month</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-200">Sent</p>
              <p className="text-lg font-bold">₹{stats?.totalSent || "0.00"}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Received</p>
              <p className="text-lg font-bold">₹{stats?.totalReceived || "0.00"}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Total</p>
              <p className="text-lg font-bold">{stats?.totalTransactions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !txns?.length ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No transactions found
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {txns.map((txn) => {
                const Icon = getIcon(txn.type, txn.direction);
                const bg = getIconBg(txn.type, txn.direction);
                return (
                  <div
                    key={txn.id}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center text-white shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {txn.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {txn.receiverName || txn.receiverPhone || txn.receiverUpiId || "—"}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {txn.createdAt
                          ? new Date(txn.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
