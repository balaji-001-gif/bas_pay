import { getDb } from "../api/queries/connection";
import { merchants, offers } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed merchants
  const merchantData = [
    { name: "Zomato", category: "food" as const, logo: "https://logo.clearbit.com/zomato.com" },
    { name: "Swiggy", category: "food" as const, logo: "https://logo.clearbit.com/swiggy.com" },
    { name: "Amazon", category: "shopping" as const, logo: "https://logo.clearbit.com/amazon.com" },
    { name: "Flipkart", category: "shopping" as const, logo: "https://logo.clearbit.com/flipkart.com" },
    { name: "IRCTC", category: "travel" as const, logo: "https://logo.clearbit.com/irctc.co.in" },
    { name: "MakeMyTrip", category: "travel" as const, logo: "https://logo.clearbit.com/makemytrip.com" },
    { name: "Netflix", category: "entertainment" as const, logo: "https://logo.clearbit.com/netflix.com" },
    { name: "Amazon Prime", category: "entertainment" as const, logo: "https://logo.clearbit.com/primevideo.com" },
    { name: "BigBasket", category: "groceries" as const, logo: "https://logo.clearbit.com/bigbasket.com" },
    { name: "Apollo Pharmacy", category: "health" as const, logo: "https://logo.clearbit.com/apollo247.com" },
    { name: "Airtel", category: "recharge" as const, logo: "https://logo.clearbit.com/airtel.in" },
    { name: "Jio", category: "recharge" as const, logo: "https://logo.clearbit.com/jio.com" },
  ];

  for (const m of merchantData) {
    const existing = await db.query.merchants.findFirst({
      where: (merchants, { eq }) => eq(merchants.name, m.name),
    });
    if (!existing) {
      await db.insert(merchants).values(m);
    }
  }

  // Seed offers
  const offerData = [
    {
      title: "20% Cashback on Food Orders",
      description: "Get 20% cashback up to ₹100 on your first food order",
      code: "FOOD20",
      discountType: "cashback" as const,
      discountValue: "20",
      maxDiscount: "100",
      minTransaction: "200",
      category: "food" as const,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
    },
    {
      title: "Flat ₹50 Off on Recharge",
      description: "Get flat ₹50 off on mobile recharge of ₹300 or more",
      code: "RECHARGE50",
      discountType: "fixed_amount" as const,
      discountValue: "50",
      maxDiscount: "50",
      minTransaction: "300",
      category: "recharge" as const,
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      usageLimit: 5000,
    },
    {
      title: "10% Off on Bill Payments",
      description: "Save 10% up to ₹200 on electricity, water, and gas bills",
      code: "BILL10",
      discountType: "percentage" as const,
      discountValue: "10",
      maxDiscount: "200",
      minTransaction: "500",
      category: "bills" as const,
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      usageLimit: 2000,
    },
    {
      title: "₹25 Cashback on First Transfer",
      description: "Get ₹25 cashback when you send money for the first time",
      code: "FIRST25",
      discountType: "cashback" as const,
      discountValue: "25",
      maxDiscount: "25",
      minTransaction: "100",
      category: "transfer" as const,
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      usageLimit: 10000,
    },
    {
      title: "15% Off on Shopping",
      description: "Get 15% off on partner shopping sites",
      code: "SHOP15",
      discountType: "percentage" as const,
      discountValue: "15",
      maxDiscount: "500",
      minTransaction: "1000",
      category: "shopping" as const,
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      usageLimit: 3000,
    },
  ];

  for (const o of offerData) {
    const existing = await db.query.offers.findFirst({
      where: (offers, { eq }) => eq(offers.code, o.code),
    });
    if (!existing) {
      await db.insert(offers).values(o);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed();
