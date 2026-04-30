import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  TicketPercent,
  Copy,
  Check,
  ShoppingBag,
  Utensils,
  Receipt,
  ArrowRight,
  Bus,
  Film,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  food: Utensils,
  shopping: ShoppingBag,
  recharge: Smartphone,
  bills: Receipt,
  travel: Bus,
  entertainment: Film,
  transfer: ArrowRight,
  all: TicketPercent,
};

const categoryColors: Record<string, string> = {
  food: "bg-rose-50 text-rose-600",
  shopping: "bg-blue-50 text-blue-600",
  recharge: "bg-emerald-50 text-emerald-600",
  bills: "bg-amber-50 text-amber-600",
  travel: "bg-cyan-50 text-cyan-600",
  entertainment: "bg-violet-50 text-violet-600",
  transfer: "bg-pink-50 text-pink-600",
  all: "bg-slate-50 text-slate-600",
};

export default function Offers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { data: offers, isLoading } = trpc.offer.list.useQuery();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Offers & Rewards</h1>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-violet-200 mb-1">Special Offer</p>
              <p className="text-xl font-bold">20% Cashback</p>
              <p className="text-sm text-violet-200">On your first bill payment</p>
            </div>
            <TicketPercent className="w-10 h-10 text-violet-200" />
          </div>
          <Button
            className="mt-4 bg-white text-violet-700 hover:bg-violet-50 font-semibold"
            size="sm"
          >
            Claim Now
          </Button>
        </div>
      </div>

      {/* Offers List */}
      <div className="px-4 pb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Offers</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : !offers?.length ? (
          <div className="text-center py-8 text-slate-400 text-sm">No offers available</div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const Icon = categoryIcons[offer.category || "all"] || TicketPercent;
              const colorClass = categoryColors[offer.category || "all"] || "bg-slate-50 text-slate-600";

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{offer.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{offer.description}</p>

                      {offer.code && (
                        <button
                          onClick={() => copyCode(offer.code!)}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          {offer.code}
                          {copiedCode === offer.code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>
                          {offer.discountType === "percentage"
                            ? `${offer.discountValue}% off`
                            : offer.discountType === "fixed_amount"
                            ? `₹${offer.discountValue} off`
                            : `₹${offer.discountValue} cashback`}
                        </span>
                        {offer.maxDiscount && (
                          <span>Max ₹{offer.maxDiscount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
