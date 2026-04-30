import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  QrCode,
  Camera,
  Flashlight,
  GalleryHorizontal,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ScanPay() {
  const [mode, setMode] = useState<"scan" | "myqr" | "pay">("scan");
  const [qrData, setQrData] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [scannedInfo, setScannedInfo] = useState<any>(null);

  const { data: myQrs, refetch: refetchMyQrs } = trpc.qr.myQrs.useQuery();
  const utils = trpc.useUtils();

  const generateQr = trpc.qr.generate.useMutation({
    onSuccess: () => {
      refetchMyQrs();
      toast.success("QR Code generated");
    },
  });

  const scanPay = trpc.qr.scanPay.useMutation({
    onSuccess: (data) => {
      toast.success(`₹${amount} paid to ${data.receiverName}`);
      utils.wallet.getWallet.invalidate();
      utils.transaction.getHistory.invalidate();
      setMode("scan");
      setQrData("");
      setAmount("");
      setPin("");
      setScannedInfo(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setPin("");
    },
  });

  const handleScan = () => {
    if (!qrData) {
      toast.error("Enter or paste QR data");
      return;
    }
    try {
      const parsed = JSON.parse(qrData);
      setScannedInfo(parsed);
      setMode("pay");
    } catch {
      toast.error("Invalid QR data");
    }
  };

  const handlePay = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter amount");
      return;
    }
    if (!pin || pin.length !== 4) {
      toast.error("Enter 4-digit PIN");
      return;
    }
    scanPay.mutate({ qrData, amount: parseFloat(amount), pin, note: "" });
  };

  return (
    <div className="min-h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-lg font-semibold">Scan & Pay</h1>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex p-1 mx-4 mt-4 bg-slate-800 rounded-xl">
        <button
          onClick={() => setMode("scan")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "scan" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          Scan
        </button>
        <button
          onClick={() => setMode("myqr")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === "myqr" ? "bg-blue-600 text-white" : "text-slate-400"
          }`}
        >
          My QR
        </button>
      </div>

      {mode === "scan" && (
        <div className="p-4">
          {/* Camera Preview Placeholder */}
          <div className="aspect-square max-w-sm mx-auto bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-3xl" />
            </div>
            <QrCode className="w-16 h-16 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">Point camera at QR code</p>
          </div>

          {/* Manual input */}
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1 block">
              Or paste QR data / UPI ID manually
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste QR data here..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
              />
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                onClick={handleScan}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-6">
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Flashlight className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Flash</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <GalleryHorizontal className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Gallery</span>
            </button>
          </div>
        </div>
      )}

      {mode === "myqr" && (
        <div className="p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800">PayEase User</p>
              <p className="text-xs text-slate-400">
                {myQrs?.[0]?.qrData
                  ? JSON.parse(myQrs[0].qrData).upiId
                  : "Generate your QR"}
              </p>
            </div>

            {/* QR Display */}
            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              {myQrs?.[0] ? (
                <div className="w-48 h-48 bg-slate-800 rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-white" />
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">No QR generated yet</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => generateQr.mutate()}
                disabled={generateQr.isPending}
              >
                {generateQr.isPending ? "Generating..." : "Generate QR"}
              </Button>
              {myQrs?.[0] && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => generateQr.mutate({ amount: 100 })}
                >
                  Amount QR
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "pay" && scannedInfo && (
        <div className="p-4">
          <div className="bg-white rounded-2xl p-5 text-slate-800 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{scannedInfo.name || "Merchant"}</p>
                <p className="text-xs text-slate-400">{scannedInfo.upiId}</p>
              </div>
              <button
                onClick={() => setMode("scan")}
                className="ml-auto p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold">
                  ₹
                </span>
                <Input
                  type="number"
                  className="pl-8 text-xl font-bold bg-slate-50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {scannedInfo.amount && (
              <p className="text-xs text-slate-500 mb-3">
                Requested amount: ₹{scannedInfo.amount}
              </p>
            )}

            <div className="mb-4">
              <label className="text-xs text-slate-500 mb-1 block">Wallet PIN</label>
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
              disabled={!amount || pin.length !== 4 || scanPay.isPending}
            >
              {scanPay.isPending ? "Processing..." : `Pay ₹${amount || "0"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
