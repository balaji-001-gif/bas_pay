import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Search,
  Send,
  ArrowDownLeft,
  User,
  Star,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SendMoney() {
  const [searchParams] = useSearchParams();
  const isRequest = searchParams.get("tab") === "request";

  const [step, setStep] = useState<"select" | "amount" | "pin">("select");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [pin, setPin] = useState("");

  const { data: beneficiaries } = trpc.beneficiary.list.useQuery();
  const { data: wallet } = trpc.wallet.getWallet.useQuery();
  const utils = trpc.useUtils();

  const sendMutation = trpc.transaction.sendMoney.useMutation({
    onSuccess: (data) => {
      toast.success(`₹${data.amount} sent to ${data.receiverName || "recipient"}`);
      utils.wallet.getWallet.invalidate();
      utils.transaction.getHistory.invalidate();
      utils.notification.unreadCount.invalidate();
      setStep("select");
      setSelectedContact(null);
      setAmount("");
      setRemark("");
      setPin("");
    },
    onError: (err) => {
      toast.error(err.message);
      setPin("");
    },
  });

  const filtered = beneficiaries?.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search)
  );

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!pin || pin.length !== 4) {
      toast.error("Enter 4-digit PIN");
      return;
    }

    sendMutation.mutate({
      receiverPhone: selectedContact?.phone,
      receiverUpiId: selectedContact?.upiId,
      amount: parseFloat(amount),
      remark,
      pin,
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
          <h1 className="text-lg font-semibold text-slate-800">
            {isRequest ? "Request Money" : "Send Money"}
          </h1>
        </div>
      </div>

      {step === "select" && (
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or UPI ID"
              className="pl-10 bg-slate-50 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 mb-5 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedContact({ name: "To Phone", phone: "" })}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-slate-600">To Phone</span>
            </button>
            <button
              onClick={() => setSelectedContact({ name: "To UPI", upiId: "" })}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-slate-600">To UPI</span>
            </button>
            <button
              onClick={() => setSelectedContact({ name: "To Self", phone: "" })}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-slate-600">To Self</span>
            </button>
          </div>

          {/* Contacts */}
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Saved Contacts</h3>
          {!filtered?.length ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {search ? "No contacts found" : "No saved contacts yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact);
                    setStep("amount");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      {contact.name}
                      {contact.isFavorite && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{contact.phone}</p>
                  </div>
                  <Send className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "amount" && selectedContact && (
        <div className="p-4">
          {/* Contact info */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{selectedContact.name}</p>
              <p className="text-xs text-slate-400">
                {selectedContact.phone || selectedContact.upiId}
              </p>
            </div>
            <button
              onClick={() => setStep("select")}
              className="ml-auto p-1 hover:bg-slate-200 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1 block">Enter Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-800">
                ₹
              </span>
              <Input
                type="number"
                className="pl-10 text-2xl font-bold h-14 bg-slate-50 border-slate-200"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Wallet balance: ₹{wallet?.balance || "0.00"}
            </p>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {[100, 500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* Remark */}
          <div className="mb-6">
            <Input
              placeholder="Add a remark (optional)"
              className="bg-slate-50 border-slate-200"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={255}
            />
          </div>

          <Button
            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={() => {
              if (parseFloat(amount) > parseFloat(wallet?.balance || "0")) {
                toast.error("Insufficient balance");
                return;
              }
              setStep("pin");
            }}
          >
            {isRequest ? "Request" : "Proceed"}
          </Button>
        </div>
      )}

      {step === "pin" && (
        <div className="p-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Send className="w-7 h-7 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800">Enter Wallet PIN</p>
            <p className="text-sm text-slate-400">
              Paying ₹{amount} to {selectedContact?.name}
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pin.length > i
                    ? "bg-blue-600 border-blue-600 scale-110"
                    : "border-slate-300"
                }`}
              />
            ))}
          </div>

          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPin(val);
              if (val.length === 4) {
                // Auto-submit after a brief delay
                setTimeout(() => handleSend(), 200);
              }
            }}
            className="absolute opacity-0 w-0 h-0"
            autoFocus
          />

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "del") {
                    setPin(pin.slice(0, -1));
                  } else if (key !== "" && pin.length < 4) {
                    setPin(pin + key);
                    if (pin.length === 3) {
                      setTimeout(() => {
                        // handleSend will be called via the input onChange or direct
                      }, 50);
                    }
                  }
                }}
                disabled={key === ""}
                className={`h-14 rounded-xl text-xl font-semibold transition-colors ${
                  key === ""
                    ? "opacity-0"
                    : key === "del"
                    ? "text-red-500 hover:bg-red-50 text-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {key === "del" ? "⌫" : key}
              </button>
            ))}
          </div>

          <Button
            className="w-full h-12 mt-6 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={handleSend}
            disabled={pin.length !== 4 || sendMutation.isPending}
          >
            {sendMutation.isPending ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      )}
    </div>
  );
}
