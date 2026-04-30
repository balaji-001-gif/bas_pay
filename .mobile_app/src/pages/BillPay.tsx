import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Bolt,
  Droplets,
  Flame,
  Wifi,
  Tv,
  Smartphone,
  Shield,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const billCategories = [
  { id: "electricity", icon: Bolt, label: "Electricity", color: "bg-yellow-500" },
  { id: "water", icon: Droplets, label: "Water", color: "bg-sky-500" },
  { id: "gas", icon: Flame, label: "Gas", color: "bg-orange-500" },
  { id: "broadband", icon: Wifi, label: "Broadband", color: "bg-cyan-500" },
  { id: "mobile", icon: Smartphone, label: "Mobile", color: "bg-rose-500" },
  { id: "dth", icon: Tv, label: "DTH", color: "bg-indigo-500" },
  { id: "insurance", icon: Shield, label: "Insurance", color: "bg-teal-500" },
  { id: "credit_card", icon: CreditCard, label: "Credit Card", color: "bg-violet-500" },
];

export default function BillPay() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") || "";

  const [step, setStep] = useState<"select" | "fetch" | "pay">(
    initialCat ? "fetch" : "select"
  );
  const [category, setCategory] = useState(initialCat || "electricity");
  const [billerId, setBillerId] = useState("ELEC_DISCOM_01");
  const [consumerNumber, setConsumerNumber] = useState("");
  const [billDetails, setBillDetails] = useState<any>(null);
  const [pin, setPin] = useState("");

  const { data: bills } = trpc.bill.list.useQuery();
  const { data: wallet, refetch } = trpc.wallet.getWallet.useQuery();
  const utils = trpc.useUtils();

  const fetchBill = trpc.bill.fetchBill.useQuery(
    { billerId, consumerNumber },
    { enabled: false }
  );

  const payBill = trpc.bill.payBill.useMutation({
    onSuccess: (_data) => {
      toast.success("Bill paid successfully!");
      refetch();
      utils.bill.list.invalidate();
      utils.transaction.getHistory.invalidate();
      setStep("select");
      setPin("");
      setConsumerNumber("");
      setBillDetails(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setPin("");
    },
  });

  const handleFetch = async () => {
    if (!consumerNumber) {
      toast.error("Enter consumer number");
      return;
    }
    try {
      const result = await fetchBill.refetch();
      if (result.data) {
        setBillDetails(result.data);
        setStep("pay");
      }
    } catch {
      toast.error("Failed to fetch bill");
    }
  };

  const handlePay = () => {
    if (!pin || pin.length !== 4) {
      toast.error("Enter 4-digit PIN");
      return;
    }
    payBill.mutate({
      billerId: billDetails.billerId,
      billerName: billDetails.billerName,
      category: billDetails.category,
      consumerNumber: billDetails.consumerNumber,
      amount: billDetails.amount,
      pin,
    });
  };

  const selectedCat = billCategories.find((c) => c.id === category);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Pay Bills</h1>
        </div>
      </div>

      {step === "select" && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Biller Category</h3>
          <div className="grid grid-cols-4 gap-3">
            {billCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setStep("fetch");
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* Recent Bills */}
          {bills && bills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Payments</h3>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
                {bills.slice(0, 5).map((bill) => (
                  <div key={bill.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{bill.billerName}</p>
                      <p className="text-xs text-slate-400">{bill.consumerNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{bill.amount}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{bill.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "fetch" && selectedCat && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className={`${selectedCat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
              <selectedCat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedCat.label} Bill</p>
              <p className="text-xs text-slate-400">Enter your details to fetch bill</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-600 mb-1 block">Consumer Number</label>
            <Input
              placeholder={`Enter ${selectedCat.label} consumer number`}
              className="bg-white border-slate-200 h-12"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-slate-600 mb-1 block">Biller</label>
            <select
              className="w-full h-12 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              value={billerId}
              onChange={(e) => setBillerId(e.target.value)}
            >
              <option value="ELEC_DISCOM_01">State Electricity Board</option>
              <option value="WATER_MUNI_01">Municipal Water Supply</option>
              <option value="GAS_BHARAT_01">Bharat Gas</option>
              <option value="BB_JIO_01">Jio Fiber</option>
            </select>
          </div>

          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
            onClick={handleFetch}
            disabled={fetchBill.isFetching}
          >
            {fetchBill.isFetching ? "Fetching..." : "Fetch Bill"}
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 mt-3"
            onClick={() => setStep("select")}
          >
            Back
          </Button>
        </div>
      )}

      {step === "pay" && billDetails && (
        <div className="p-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              {selectedCat && (
                <div className={`${selectedCat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
                  <selectedCat.icon className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">{billDetails.billerName}</p>
                <p className="text-xs text-slate-400">{billDetails.consumerNumber}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Bill Amount</span>
                <span className="text-lg font-bold text-slate-800">₹{billDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Bill Date</span>
                <span className="text-sm text-slate-700">{billDetails.billDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Due Date</span>
                <span className="text-sm text-red-500">{billDetails.dueDate}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <span className="text-sm text-slate-500">Wallet Balance</span>
                <span className="text-sm font-medium text-slate-700">
                  ₹{wallet?.balance || "0.00"}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-600 mb-1 block">Wallet PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="bg-slate-50 text-center tracking-[0.5em] font-bold"
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPin(val);
                }}
              />
            </div>

            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
              onClick={handlePay}
              disabled={pin.length !== 4 || payBill.isPending}
            >
              {payBill.isPending ? "Processing..." : `Pay ₹${billDetails.amount}`}
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => setStep("fetch")}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
