import { Farmer, MilkEntry } from '../types';
import { calculateMilkTotals, DEFAULT_RATE_CONFIG } from '../utils/rateCalculator';

export const INITIAL_FARMERS: Farmer[] = [
  {
    id: 'f-101',
    code: '101',
    name: 'Ramesh Patel',
    phone: '+91 98251 44321',
    village: 'Anandpur',
    defaultMilkType: 'Cow',
    bankAccount: '918020038411',
    ifsc: 'BARB0ANANDP',
    isActive: true,
  },
  {
    id: 'f-102',
    code: '102',
    name: 'Suresh Yadav',
    phone: '+91 94140 88290',
    village: 'Gokulnagari',
    defaultMilkType: 'Buffalo',
    bankAccount: '203940192834',
    ifsc: 'SBIN0004921',
    isActive: true,
  },
  {
    id: 'f-103',
    code: '103',
    name: 'Baldev Singh',
    phone: '+91 97841 12390',
    village: 'Kisanwadi',
    defaultMilkType: 'Buffalo',
    bankAccount: '304918293041',
    ifsc: 'PUNB0192000',
    isActive: true,
  },
  {
    id: 'f-104',
    code: '104',
    name: 'Anjali Devi',
    phone: '+91 99341 55672',
    village: 'Anandpur',
    defaultMilkType: 'Cow',
    bankAccount: '109283746501',
    ifsc: 'BARB0ANANDP',
    isActive: true,
  },
  {
    id: 'f-105',
    code: '105',
    name: 'Rajesh Gowda',
    phone: '+91 94481 77312',
    village: 'Devapura',
    defaultMilkType: 'Cow',
    bankAccount: '401928374619',
    ifsc: 'CNRB0002819',
    isActive: true,
  },
  {
    id: 'f-106',
    code: '106',
    name: 'Manoj Choudhary',
    phone: '+91 98290 66124',
    village: 'Gokulnagari',
    defaultMilkType: 'Buffalo',
    bankAccount: '501928374651',
    ifsc: 'SBIN0004921',
    isActive: true,
  },
  {
    id: 'f-107',
    code: '107',
    name: 'Lakshmi Bai',
    phone: '+91 91660 33491',
    village: 'Kisanwadi',
    defaultMilkType: 'Cow',
    bankAccount: '601928374182',
    ifsc: 'PUNB0192000',
    isActive: true,
  },
  {
    id: 'f-108',
    code: '108',
    name: 'Harish Verma',
    phone: '+91 97120 44819',
    village: 'Devapura',
    defaultMilkType: 'Buffalo',
    bankAccount: '701928374921',
    ifsc: 'CNRB0002819',
    isActive: true,
  },
];

// Helper to generate realistic 10-day shift entries (Sep 1 to Sep 10, 2026)
export function generateInitialEntries(): MilkEntry[] {
  const entries: MilkEntry[] = [];
  let receiptCounter = 1001;

  // 10-day period: 2026-09-01 to 2026-09-10
  const dates = [
    '2026-09-01',
    '2026-09-02',
    '2026-09-03',
    '2026-09-04',
    '2026-09-05',
    '2026-09-06',
    '2026-09-07',
    '2026-09-08',
    '2026-09-09',
    '2026-09-10',
  ];

  // Base parameters per farmer for natural realism with slight daily jitter
  const farmerProfiles: Record<
    string,
    { baseLiters: number; baseFat: number; baseSnf: number }
  > = {
    'f-101': { baseLiters: 14.5, baseFat: 3.8, baseSnf: 8.6 }, // Cow
    'f-102': { baseLiters: 22.0, baseFat: 6.8, baseSnf: 9.1 }, // Buffalo
    'f-103': { baseLiters: 18.0, baseFat: 7.1, baseSnf: 9.2 }, // Buffalo
    'f-104': { baseLiters: 11.2, baseFat: 4.1, baseSnf: 8.7 }, // Cow
    'f-105': { baseLiters: 16.0, baseFat: 3.6, baseSnf: 8.5 }, // Cow
    'f-106': { baseLiters: 19.5, baseFat: 6.6, baseSnf: 9.0 }, // Buffalo
    'f-107': { baseLiters: 9.8, baseFat: 3.9, baseSnf: 8.6 }, // Cow
    'f-108': { baseLiters: 25.0, baseFat: 6.9, baseSnf: 9.1 }, // Buffalo
  };

  dates.forEach((date, dayIndex) => {
    // 2 shifts: Morning (M) and Evening (E)
    const shifts: ('M' | 'E')[] = ['M', 'E'];

    shifts.forEach((shift) => {
      INITIAL_FARMERS.forEach((farmer, fIdx) => {
        // Evening milk quantity is typically 10-15% lower than morning, fat slightly higher
        const profile = farmerProfiles[farmer.id];
        const shiftFactor = shift === 'M' ? 1.05 : 0.95;
        const jitter = ((dayIndex * 7 + fIdx * 11) % 7 - 3) * 0.4;
        const liters = Number(Math.max(6, profile.baseLiters * shiftFactor + jitter).toFixed(1));

        const fatJitter = (((dayIndex * 3 + fIdx * 5 + (shift === 'E' ? 2 : 0)) % 5) - 2) * 0.1;
        const fat = Number(Math.max(3.2, profile.baseFat + fatJitter).toFixed(1));

        const snfJitter = (((dayIndex * 2 + fIdx * 3) % 4) - 1.5) * 0.08;
        const snf = Number(Math.max(8.2, profile.baseSnf + snfJitter).toFixed(2));

        const clr = Math.round((snf - 0.36 - 0.21 * fat) * 4);

        const calc = calculateMilkTotals(liters, fat, snf, farmer.defaultMilkType, DEFAULT_RATE_CONFIG);

        entries.push({
          id: `entry-${receiptCounter}`,
          receiptNo: `REC-${receiptCounter}`,
          date,
          shift,
          farmerId: farmer.id,
          farmerCode: farmer.code,
          farmerName: farmer.name,
          milkType: farmer.defaultMilkType,
          liters,
          fat,
          snf,
          clr,
          ratePerLiter: calc.ratePerLiter,
          totalAmount: calc.totalAmount,
          plantRatePerLiter: calc.plantRatePerLiter,
          plantTotalAmount: calc.plantTotalAmount,
          societyProfit: calc.societyProfit,
          createdAt: `${date}T${shift === 'M' ? '07:30:00' : '18:15:00'}.000Z`,
        });

        receiptCounter++;
      });
    });
  });

  return entries;
}
