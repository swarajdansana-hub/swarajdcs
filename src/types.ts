export type ShiftType = 'M' | 'E'; // Morning or Evening
export type MilkType = 'Cow' | 'Buffalo';

export interface Farmer {
  id: string;
  code: string; // e.g. "101", "102"
  name: string;
  phone: string;
  village: string;
  defaultMilkType: MilkType;
  bankAccount?: string;
  ifsc?: string;
  isActive: boolean;
}

export interface RateConfig {
  // Cow Rate settings (standard benchmark: 3.5% Fat, 8.5% SNF)
  cowBaseRate: number; // e.g. 36.00 / L
  cowStandardFat: number; // 3.5%
  cowStandardSNF: number; // 8.5%
  cowFatIncRate: number; // rate diff per 0.1% Fat (e.g. 0.40)
  cowSnfIncRate: number; // rate diff per 0.1% SNF (e.g. 0.35)

  // Buffalo Rate settings (standard benchmark: 6.5% Fat, 9.0% SNF)
  buffaloBaseRate: number; // e.g. 58.00 / L
  buffaloStandardFat: number; // 6.5%
  buffaloStandardSNF: number; // 9.0%
  buffaloFatIncRate: number; // rate diff per 0.1% Fat (e.g. 0.65)
  buffaloSnfIncRate: number; // rate diff per 0.1% SNF (e.g. 0.45)

  // DCS Society Margin / Commission paid by Apex Dairy Plant per Litre
  dcsMarginPerLiter: number; // e.g. 2.75 / L
  plantFatKgRate: number; // e.g. 480 per kg fat
  plantSnfKgRate: number; // e.g. 320 per kg snf
}

export interface MilkEntry {
  id: string;
  receiptNo: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  milkType: MilkType;
  liters: number;
  fat: number; // % e.g. 4.2
  snf: number; // % e.g. 8.6
  clr?: number; // Corrected Lactometer Reading (optional)
  ratePerLiter: number; // Farmer payout rate
  totalAmount: number; // liters * ratePerLiter
  plantRatePerLiter: number; // Plant purchase rate
  plantTotalAmount: number; // liters * plantRatePerLiter
  societyProfit: number; // plantTotalAmount - totalAmount
  createdAt: string;
}

export interface CycleSummary {
  cycleId: string;
  cycleNumber: 1 | 2 | 3;
  month: number; // 0-11
  year: number;
  startDate: string;
  endDate: string;
  label: string; // e.g., "Cycle 1 (Sep 1 - Sep 10, 2026)"
  totalLiters: number;
  totalEntries: number;
  farmerPayout: number;
  plantRevenue: number;
  societyProfit: number;
  avgFat: number;
  avgSNF: number;
  farmerSummaries: FarmerCycleSummary[];
}

export interface FarmerCycleSummary {
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  milkType: MilkType;
  totalLiters: number;
  shiftsCount: number;
  avgFat: number;
  avgSNF: number;
  avgRate: number;
  grossAmount: number;
  deductions: {
    cattleFeed: number;
    veterinary: number;
    advanceLoan: number;
  };
  totalDeductions: number;
  netPayable: number;
  paymentStatus: 'Pending' | 'Approved' | 'Paid';
  paidAt?: string;
  entries: MilkEntry[];
}

export interface DailyProfitSummary {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  totalLiters: number;
  morningLiters: number;
  eveningLiters: number;
  morningProfit: number;
  eveningProfit: number;
  farmerPayout: number;
  plantRevenue: number;
  netProfit: number;
  marginPercent: number;
  avgFat: number;
  avgSNF: number;
  entriesCount: number;
}
