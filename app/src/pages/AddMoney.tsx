import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Landmark,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const methods = [
  { id: "upi", icon: Smartphone, label: "UPI", desc: "Instant via any UPI app" },
  { id: "card", icon: CreditCard, label: "Debit/Credit Card", desc: "Visa, Mastercard, Rupay" },
  { id: "netbanking", icon: Landmark, label: "Net Banking", desc: "All major banks" },
];

export default function AddMoney() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [step, setStep] = useState<"amount" | "confirm">("amount");

  const { data: wallet, refetch } = trpc.wallet.getWallet.useQuery();
  const utils = trpc.useUtils();

  const addMoney = trpc.wallet.addMoney.useMutation({
    onSuccess: (data) => {
      toast.success(`₹${data.newBalance} added successfully!`);
      refetch();
      utils.transaction.getHistory.invalidate();
      setAmount("");
      setStep("amount");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleAdd = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addMoney.mutate({
      amount: parseFloat(amount),
      paymentMethod: method as "upi" | "card" | "netbanking",
    });
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Add Money</h1>
        </div>
      </div>

      {step === "amount" && (
        <div className="p-4">
          {/* Balance */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Current Balance</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              ₹{wallet?.balance || "0.00"}
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-800">
                ₹
              </span>
              <Input
                type="number"
                className="pl-12 text-2xl font-bold h-14 bg-slate-50 border-slate-200"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {[500, 1000, 2000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* Payment Methods */}
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Payment Method
          </label>
          <div className="space-y-2 mb-6">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                  method === m.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method === m.id ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
                {method === m.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <Button
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={() => setStep("confirm")}
          >
            Proceed to Add ₹{amount || "0"}
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="p-4">
          <div className="bg-slate-50 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <span className="text-sm text-slate-500">Amount</span>
              <span className="text-lg font-bold text-slate-800">₹{amount}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <span className="text-sm text-slate-500">Payment Method</span>
              <span className="text-sm font-medium text-slate-800 capitalize">{method}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">New Balance</span>
              <span className="text-lg font-bold text-blue-600">
                ₹{(parseFloat(wallet?.balance || "0") + parseFloat(amount || "0")).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setStep("amount")}
            >
              Back
            </Button>
            <Button
              className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              onClick={handleAdd}
              disabled={addMoney.isPending}
            >
              {addMoney.isPending ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
