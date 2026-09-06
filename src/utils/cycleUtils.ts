import { MilkEntry, Farmer, FarmerCycleSummary, CycleSummary, DailyProfitSummary } from '../types';

export function getCycleInfo(dateStr: string): { cycleNumber: 1 | 2 | 3; cycleLabel: string } {
  const date = new Date(dateStr);
  const day = date.getDate();
  if (day <= 10) {
    return { cycleNumber: 1, cycleLabel: 'Cycle 1 (1st - 10th)' };
  } else if (day <= 20) {
    return { cycleNumber: 2, cycleLabel: 'Cycle 2 (11th - 20th)' };
  } else {
    return { cycleNumber: 3, cycleLabel: 'Cycle 3 (21st - End of Month)' };
  }
}

/**
 * Filter entries by year, month, and 10-day cycle number (1, 2, or 3)
 */
export function getEntriesForCycle(
  entries: MilkEntry[],
  year: number,
  month: number, // 0-11
  cycleNumber: 1 | 2 | 3
): MilkEntry[] {
  return entries.filter((entry) => {
    const d = new Date(entry.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return false;
    const day = d.getDate();
    if (cycleNumber === 1) return day >= 1 && day <= 10;
    if (cycleNumber === 2) return day >= 11 && day <= 20;
    return day >= 21;
  });
}

/**
 * Generate 10-Days Payment Cycle Summary
 */
export function calculateCycleSummary(
  cycleNumber: 1 | 2 | 3,
  year: number,
  month: number,
  entries: MilkEntry[],
  farmers: Farmer[]
): CycleSummary {
  const cycleEntries = getEntriesForCycle(entries, year, month, cycleNumber);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonth = monthNames[month].slice(0, 3);

  let startDay = 1;
  let endDay = 10;
  if (cycleNumber === 2) {
    startDay = 11;
    endDay = 20;
  } else if (cycleNumber === 3) {
    startDay = 21;
    // last day of month
    endDay = new Date(year, month + 1, 0).getDate();
  }

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  const label = `Cycle ${cycleNumber} (${shortMonth} ${startDay} – ${shortMonth} ${endDay}, ${year})`;

  // Total sums
  let totalLiters = 0;
  let totalFatKg = 0;
  let totalSnfKg = 0;
  let farmerPayout = 0;
  let plantRevenue = 0;
  let societyProfit = 0;

  // Group by farmer
  const farmerSummariesMap: Record<string, MilkEntry[]> = {};
  farmers.forEach((f) => {
    farmerSummariesMap[f.id] = [];
  });

  cycleEntries.forEach((entry) => {
    totalLiters += entry.liters;
    totalFatKg += (entry.liters * entry.fat) / 100;
    totalSnfKg += (entry.liters * entry.snf) / 100;
    farmerPayout += entry.totalAmount;
    plantRevenue += entry.plantTotalAmount;
    societyProfit += entry.societyProfit;

    if (!farmerSummariesMap[entry.farmerId]) {
      farmerSummariesMap[entry.farmerId] = [];
    }
    farmerSummariesMap[entry.farmerId].push(entry);
  });

  const avgFat = totalLiters > 0 ? Number(((totalFatKg / totalLiters) * 100).toFixed(2)) : 0;
  const avgSNF = totalLiters > 0 ? Number(((totalSnfKg / totalLiters) * 100).toFixed(2)) : 0;

  const farmerSummaries: FarmerCycleSummary[] = farmers.map((farmer) => {
    const fEntries = farmerSummariesMap[farmer.id] || [];
    let fLiters = 0;
    let fFatKg = 0;
    let fSnfKg = 0;
    let fGross = 0;

    fEntries.forEach((e) => {
      fLiters += e.liters;
      fFatKg += (e.liters * e.fat) / 100;
      fSnfKg += (e.liters * e.snf) / 100;
      fGross += e.totalAmount;
    });

    const fAvgFat = fLiters > 0 ? Number(((fFatKg / fLiters) * 100).toFixed(2)) : 0;
    const fAvgSnf = fLiters > 0 ? Number(((fSnfKg / fLiters) * 100).toFixed(2)) : 0;
    const fAvgRate = fLiters > 0 ? Number((fGross / fLiters).toFixed(2)) : 0;

    // Standard deductions in Indian DCS (e.g. cattle feed bag deductions if gross > 5000)
    // Small realistic deductions for demonstration
    const cattleFeed = fGross > 8000 ? 550 : fGross > 4000 ? 300 : 0;
    const veterinary = fLiters > 100 ? 50 : 0;
    const advanceLoan = 0;
    const totalDeductions = cattleFeed + veterinary + advanceLoan;
    const netPayable = Math.max(0, Number((fGross - totalDeductions).toFixed(2)));

    return {
      farmerId: farmer.id,
      farmerCode: farmer.code,
      farmerName: farmer.name,
      milkType: farmer.defaultMilkType,
      totalLiters: Number(fLiters.toFixed(1)),
      shiftsCount: fEntries.length,
      avgFat: fAvgFat,
      avgSNF: fAvgSnf,
      avgRate: fAvgRate,
      grossAmount: Number(fGross.toFixed(2)),
      deductions: {
        cattleFeed,
        veterinary,
        advanceLoan,
      },
      totalDeductions,
      netPayable,
      paymentStatus: fLiters > 0 ? 'Approved' : 'Pending',
      entries: fEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  });

  return {
    cycleId: `${year}-${month + 1}-C${cycleNumber}`,
    cycleNumber,
    month,
    year,
    startDate,
    endDate,
    label,
    totalLiters: Number(totalLiters.toFixed(1)),
    totalEntries: cycleEntries.length,
    farmerPayout: Number(farmerPayout.toFixed(2)),
    plantRevenue: Number(plantRevenue.toFixed(2)),
    societyProfit: Number(societyProfit.toFixed(2)),
    avgFat,
    avgSNF,
    farmerSummaries: farmerSummaries.filter((f) => f.totalLiters > 0 || f.shiftsCount > 0),
  };
}

/**
 * Calculate Daily Profit Summaries across all available dates
 */
export function calculateDailyProfitSummaries(entries: MilkEntry[]): DailyProfitSummary[] {
  const dateMap: Record<string, MilkEntry[]> = {};

  entries.forEach((entry) => {
    if (!dateMap[entry.date]) {
      dateMap[entry.date] = [];
    }
    dateMap[entry.date].push(entry);
  });

  const sortedDates = Object.keys(dateMap).sort();

  return sortedDates.map((dateStr) => {
    const dayEntries = dateMap[dateStr];
    let totalLiters = 0;
    let morningLiters = 0;
    let eveningLiters = 0;
    let morningProfit = 0;
    let eveningProfit = 0;
    let farmerPayout = 0;
    let plantRevenue = 0;
    let netProfit = 0;
    let totalFatKg = 0;
    let totalSnfKg = 0;

    dayEntries.forEach((e) => {
      totalLiters += e.liters;
      farmerPayout += e.totalAmount;
      plantRevenue += e.plantTotalAmount;
      netProfit += e.societyProfit;
      totalFatKg += (e.liters * e.fat) / 100;
      totalSnfKg += (e.liters * e.snf) / 100;

      if (e.shift === 'M') {
        morningLiters += e.liters;
        morningProfit += e.societyProfit;
      } else {
        eveningLiters += e.liters;
        eveningProfit += e.societyProfit;
      }
    });

    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const avgFat = totalLiters > 0 ? Number(((totalFatKg / totalLiters) * 100).toFixed(2)) : 0;
    const avgSNF = totalLiters > 0 ? Number(((totalSnfKg / totalLiters) * 100).toFixed(2)) : 0;
    const marginPercent = plantRevenue > 0 ? Number(((netProfit / plantRevenue) * 100).toFixed(2)) : 0;

    return {
      date: dateStr,
      displayDate,
      dayOfWeek,
      totalLiters: Number(totalLiters.toFixed(1)),
      morningLiters: Number(morningLiters.toFixed(1)),
      eveningLiters: Number(eveningLiters.toFixed(1)),
      morningProfit: Number(morningProfit.toFixed(2)),
      eveningProfit: Number(eveningProfit.toFixed(2)),
      farmerPayout: Number(farmerPayout.toFixed(2)),
      plantRevenue: Number(plantRevenue.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      marginPercent,
      avgFat,
      avgSNF,
      entriesCount: dayEntries.length,
    };
  });
}
