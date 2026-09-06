import { MilkType, RateConfig } from '../types';

export const DEFAULT_RATE_CONFIG: RateConfig = {
  cowBaseRate: 36.50, // base rate for 3.5 Fat / 8.5 SNF
  cowStandardFat: 3.5,
  cowStandardSNF: 8.5,
  cowFatIncRate: 0.40, // +/- ₹0.40 per 0.1% Fat variation
  cowSnfIncRate: 0.35, // +/- ₹0.35 per 0.1% SNF variation

  buffaloBaseRate: 58.00, // base rate for 6.5 Fat / 9.0 SNF
  buffaloStandardFat: 6.5,
  buffaloStandardSNF: 9.0,
  buffaloFatIncRate: 0.60, // +/- ₹0.60 per 0.1% Fat variation
  buffaloSnfIncRate: 0.45, // +/- ₹0.45 per 0.1% SNF variation

  // Dairy apex plant pays society +₹2.75 / Litre handling/procurement commission
  dcsMarginPerLiter: 2.75,
  plantFatKgRate: 480,
  plantSnfKgRate: 320,
};

/**
 * Calculate SNF from CLR (Corrected Lactometer Reading) and Fat %
 * Standard Indian Dairy ISI formula: SNF = (CLR / 4) + (0.21 * FAT) + 0.36
 */
export function calculateSnfFromClr(clr: number, fat: number): number {
  if (!clr || isNaN(clr) || !fat || isNaN(fat)) return 0;
  const snf = (clr / 4) + (0.21 * fat) + 0.36;
  return Number(snf.toFixed(2));
}

/**
 * Calculate rate per litre for farmer based on milk type, fat, and snf
 */
export function calculateFarmerRate(
  milkType: MilkType,
  fat: number,
  snf: number,
  config: RateConfig = DEFAULT_RATE_CONFIG
): number {
  if (!fat || !snf || isNaN(fat) || isNaN(snf) || fat <= 0 || snf <= 0) {
    return 0;
  }

  let rate = 0;
  if (milkType === 'Cow') {
    const fatDiff = (fat - config.cowStandardFat) * 10; // in 0.1 increments
    const snfDiff = (snf - config.cowStandardSNF) * 10;
    rate = config.cowBaseRate + (fatDiff * config.cowFatIncRate) + (snfDiff * config.cowSnfIncRate);
    // Minimum floor rate safeguard
    rate = Math.max(22.0, rate);
  } else {
    const fatDiff = (fat - config.buffaloStandardFat) * 10;
    const snfDiff = (snf - config.buffaloStandardSNF) * 10;
    rate = config.buffaloBaseRate + (fatDiff * config.buffaloFatIncRate) + (snfDiff * config.buffaloSnfIncRate);
    // Minimum floor rate safeguard
    rate = Math.max(35.0, rate);
  }

  return Number(rate.toFixed(2));
}

/**
 * Calculate the rate at which Apex Dairy Plant buys from DCS society.
 * The society earns the margin per litre (or plant incentive formula).
 */
export function calculatePlantRate(
  farmerRate: number,
  config: RateConfig = DEFAULT_RATE_CONFIG
): number {
  if (farmerRate <= 0) return 0;
  return Number((farmerRate + config.dcsMarginPerLiter).toFixed(2));
}

/**
 * Full calculation breakdown
 */
export interface CalculationResult {
  ratePerLiter: number;
  totalAmount: number;
  plantRatePerLiter: number;
  plantTotalAmount: number;
  societyProfit: number;
  fatKg: number;
  snfKg: number;
}

export function calculateMilkTotals(
  liters: number,
  fat: number,
  snf: number,
  milkType: MilkType,
  config: RateConfig = DEFAULT_RATE_CONFIG
): CalculationResult {
  const ratePerLiter = calculateFarmerRate(milkType, fat, snf, config);
  const totalAmount = Number((liters * ratePerLiter).toFixed(2));
  
  const plantRatePerLiter = calculatePlantRate(ratePerLiter, config);
  const plantTotalAmount = Number((liters * plantRatePerLiter).toFixed(2));
  
  const societyProfit = Number((plantTotalAmount - totalAmount).toFixed(2));
  
  // KG Fat & SNF calculation: Liters * % / 100
  const fatKg = Number(((liters * fat) / 100).toFixed(3));
  const snfKg = Number(((liters * snf) / 100).toFixed(3));

  return {
    ratePerLiter,
    totalAmount,
    plantRatePerLiter,
    plantTotalAmount,
    societyProfit,
    fatKg,
    snfKg,
  };
}
