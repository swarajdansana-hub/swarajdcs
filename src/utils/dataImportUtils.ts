import { Farmer, RateConfig, MilkType } from '../types';

export interface ParseResult<T> {
  data: T;
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

// Helper to strip quotes and trim
const cleanCell = (cell: string): string => {
  return cell.replace(/^["']|["']$/g, '').trim();
};

// Split CSV lines accounting for potential quotes
const parseCSVLine = (line: string, delimiter: string = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(cleanCell(current));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(cleanCell(current));
  return result;
};

// Detect delimiter (comma, tab, semicolon)
const detectDelimiter = (text: string): string => {
  const firstLine = text.split('\n')[0] || '';
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes(';') && !firstLine.includes(',')) return ';';
  return ',';
};

/**
 * Parses Farmers data from CSV text
 */
export const parseFarmersCSV = (csvText: string): ParseResult<Farmer[]> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const farmers: Farmer[] = [];

  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    return { data: [], errors: ['File is empty'], warnings: [], totalRows: 0, validRows: 0 };
  }

  const delimiter = detectDelimiter(csvText);
  let headerIndex = -1;
  let colIndexMap: { [key: string]: number } = {};

  // Find header row
  for (let i = 0; i < Math.min(5, rawLines.length); i++) {
    const cells = parseCSVLine(rawLines[i], delimiter).map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (cells.some((c) => c.includes('code') || c.includes('name') || c.includes('farmer'))) {
      headerIndex = i;
      cells.forEach((cell, idx) => {
        if (cell.includes('code') || cell === 'id' || cell.includes('memberno') || cell.includes('kisancode')) {
          colIndexMap['code'] = idx;
        } else if (cell.includes('name') || cell.includes('farmername') || cell.includes('membername')) {
          colIndexMap['name'] = idx;
        } else if (cell.includes('phone') || cell.includes('mobile') || cell.includes('contact')) {
          colIndexMap['phone'] = idx;
        } else if (cell.includes('village') || cell.includes('address') || cell.includes('town')) {
          colIndexMap['village'] = idx;
        } else if (cell.includes('milk') || cell.includes('variety') || cell.includes('type') || cell.includes('animal')) {
          colIndexMap['milkType'] = idx;
        } else if (cell.includes('bank') || cell.includes('account') || cell.includes('accno') || cell.includes('acno')) {
          colIndexMap['bankAccount'] = idx;
        } else if (cell.includes('ifsc')) {
          colIndexMap['ifsc'] = idx;
        }
      });
      break;
    }
  }

  // Fallback to default column order if no matching header found
  if (headerIndex === -1) {
    warnings.push('Header row not recognized; assuming columns: Code, Name, Phone, Village, MilkType, BankAccount, IFSC');
    colIndexMap = {
      code: 0,
      name: 1,
      phone: 2,
      village: 3,
      milkType: 4,
      bankAccount: 5,
      ifsc: 6,
    };
    headerIndex = -1;
  }

  const dataLines = rawLines.slice(headerIndex + 1);
  let processed = 0;

  dataLines.forEach((line, lineIdx) => {
    // Skip comments or title lines
    if (line.startsWith('#') || line.startsWith('//')) return;
    const cells = parseCSVLine(line, delimiter);
    if (cells.length < 2 || !cells.some((c) => c.length > 0)) return;

    processed++;
    const code = colIndexMap['code'] !== undefined ? cells[colIndexMap['code']] : cells[0];
    const name = colIndexMap['name'] !== undefined ? cells[colIndexMap['name']] : cells[1];

    if (!code || !name) {
      warnings.push(`Row ${lineIdx + 1}: Skipped due to missing Farmer Code or Name.`);
      return;
    }

    const phone = colIndexMap['phone'] !== undefined ? cells[colIndexMap['phone']] : cells[2] || 'N/A';
    const village = colIndexMap['village'] !== undefined ? cells[colIndexMap['village']] : cells[3] || 'General';
    const rawType = colIndexMap['milkType'] !== undefined ? (cells[colIndexMap['milkType']] || '').toLowerCase() : '';
    const defaultMilkType: MilkType = rawType.includes('buf') ? 'Buffalo' : 'Cow';
    const bankAccount = colIndexMap['bankAccount'] !== undefined ? cells[colIndexMap['bankAccount']] : cells[5];
    const ifsc = colIndexMap['ifsc'] !== undefined ? cells[colIndexMap['ifsc']] : cells[6];

    farmers.push({
      id: `f-${code}`,
      code: String(code).trim(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : 'N/A',
      village: village ? String(village).trim() : 'General',
      defaultMilkType,
      bankAccount: bankAccount ? String(bankAccount).trim() : undefined,
      ifsc: ifsc ? String(ifsc).trim().toUpperCase() : undefined,
      isActive: true,
    });
  });

  if (farmers.length === 0) {
    errors.push('No valid farmer records could be extracted from the file.');
  }

  return {
    data: farmers,
    errors,
    warnings,
    totalRows: processed,
    validRows: farmers.length,
  };
};

/**
 * Parses Farmers data from JSON text
 */
export const parseFarmersJSON = (jsonText: string): ParseResult<Farmer[]> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const farmers: Farmer[] = [];

  try {
    const parsed = JSON.parse(jsonText);
    const list = Array.isArray(parsed) ? parsed : parsed.farmers || parsed.data;

    if (!Array.isArray(list)) {
      return {
        data: [],
        errors: ['Invalid JSON structure. Expected an array of farmer objects or a root { "farmers": [...] }'],
        warnings: [],
        totalRows: 0,
        validRows: 0,
      };
    }

    list.forEach((item: any, idx: number) => {
      const code = item.code || item.farmerCode || item.id || item.farmer_code;
      const name = item.name || item.farmerName || item.farmer_name;

      if (!code || !name) {
        warnings.push(`Item #${idx + 1}: Missing code or name, skipped.`);
        return;
      }

      const rawType = String(item.defaultMilkType || item.milkType || item.variety || '').toLowerCase();
      const defaultMilkType: MilkType = rawType.includes('buf') ? 'Buffalo' : 'Cow';

      farmers.push({
        id: `f-${code}`,
        code: String(code).trim(),
        name: String(name).trim(),
        phone: item.phone || item.mobile || 'N/A',
        village: item.village || 'General',
        defaultMilkType,
        bankAccount: item.bankAccount || item.accountNo || item.account,
        ifsc: item.ifsc ? String(item.ifsc).toUpperCase() : undefined,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
      });
    });

    return {
      data: farmers,
      errors: farmers.length === 0 ? ['No valid farmer objects found in JSON.'] : [],
      warnings,
      totalRows: list.length,
      validRows: farmers.length,
    };
  } catch (err: any) {
    return {
      data: [],
      errors: [`JSON parse error: ${err.message}`],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }
};

/**
 * Parses Rate Configuration from CSV or text
 * Supports parameter list: Parameter,Value or Key,Value
 */
export const parseRateConfigCSV = (
  csvText: string,
  baseConfig: RateConfig
): ParseResult<RateConfig> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const updated: RateConfig = { ...baseConfig };
  let matchCount = 0;

  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const delimiter = detectDelimiter(csvText);

  // Parameter synonym map
  const paramMap: { [key: string]: keyof RateConfig } = {
    cowbaserate: 'cowBaseRate',
    cow_base_rate: 'cowBaseRate',
    cowbase: 'cowBaseRate',
    cowstandardfat: 'cowStandardFat',
    cow_standard_fat: 'cowStandardFat',
    cowfatbenchmark: 'cowStandardFat',
    cowstandardsnf: 'cowStandardSNF',
    cow_standard_snf: 'cowStandardSNF',
    cowsnfbenchmark: 'cowStandardSNF',
    cowfatincrate: 'cowFatIncRate',
    cow_fat_inc_rate: 'cowFatIncRate',
    cowfatdiff: 'cowFatIncRate',
    cowsnfincrate: 'cowSnfIncRate',
    cow_snf_inc_rate: 'cowSnfIncRate',
    cowsnfdiff: 'cowSnfIncRate',

    buffalobaserate: 'buffaloBaseRate',
    buffalo_base_rate: 'buffaloBaseRate',
    bufbaserate: 'buffaloBaseRate',
    buffalostandardfat: 'buffaloStandardFat',
    buffalostandardsnf: 'buffaloStandardSNF',
    buffalofatincrate: 'buffaloFatIncRate',
    buffalosnfincrate: 'buffaloSnfIncRate',

    dcsmarginperliter: 'dcsMarginPerLiter',
    dcs_margin_per_liter: 'dcsMarginPerLiter',
    dcs_margin: 'dcsMarginPerLiter',
    societymargin: 'dcsMarginPerLiter',
    plantfatkgrate: 'plantFatKgRate',
    plantsnfkgrate: 'plantSnfKgRate',
  };

  rawLines.forEach((line, idx) => {
    // Check if line contains exported format like "Base Rate: INR 36 @ 3.5% Fat / 8.5% SNF"
    if (line.includes('Base Rate: INR') || line.includes('Base Rate:')) {
      const match = line.match(/INR\s*([\d.]+)\s*@\s*([\d.]+)%\s*Fat\s*\/\s*([\d.]+)%\s*SNF/i);
      if (match) {
        const [, rate, fat, snf] = match;
        const isCow = line.toLowerCase().includes('cow');
        if (isCow) {
          updated.cowBaseRate = parseFloat(rate);
          updated.cowStandardFat = parseFloat(fat);
          updated.cowStandardSNF = parseFloat(snf);
          matchCount += 3;
        } else {
          updated.buffaloBaseRate = parseFloat(rate);
          updated.buffaloStandardFat = parseFloat(fat);
          updated.buffaloStandardSNF = parseFloat(snf);
          matchCount += 3;
        }
        return;
      }
    }

    const cells = parseCSVLine(line, delimiter);
    if (cells.length < 2) return;

    const rawKey = cells[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const rawVal = parseFloat(cells[1].replace(/[^0-9.]/g, ''));

    if (isNaN(rawVal)) return;

    if (paramMap[rawKey]) {
      const targetKey = paramMap[rawKey];
      updated[targetKey] = rawVal;
      matchCount++;
    }
  });

  if (matchCount === 0) {
    errors.push(
      'Could not find any recognized rate parameters. Please ensure parameters use keys such as cowBaseRate, buffaloBaseRate, dcsMarginPerLiter.'
    );
  }

  return {
    data: updated,
    errors,
    warnings,
    totalRows: rawLines.length,
    validRows: matchCount,
  };
};

/**
 * Parses Rate Configuration from JSON text
 */
export const parseRateConfigJSON = (
  jsonText: string,
  baseConfig: RateConfig
): ParseResult<RateConfig> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const updated: RateConfig = { ...baseConfig };
  let matchCount = 0;

  try {
    const parsed = JSON.parse(jsonText);
    const source = parsed.rateConfig || parsed.config || parsed;

    const keys: (keyof RateConfig)[] = [
      'cowBaseRate',
      'cowStandardFat',
      'cowStandardSNF',
      'cowFatIncRate',
      'cowSnfIncRate',
      'buffaloBaseRate',
      'buffaloStandardFat',
      'buffaloStandardSNF',
      'buffaloFatIncRate',
      'buffaloSnfIncRate',
      'dcsMarginPerLiter',
      'plantFatKgRate',
      'plantSnfKgRate',
    ];

    keys.forEach((k) => {
      if (source[k] !== undefined) {
        const val = parseFloat(source[k]);
        if (!isNaN(val)) {
          updated[k] = val;
          matchCount++;
        }
      }
    });

    if (matchCount === 0) {
      errors.push('No recognized rate configuration keys found in JSON.');
    }

    return {
      data: updated,
      errors,
      warnings,
      totalRows: Object.keys(source).length,
      validRows: matchCount,
    };
  } catch (err: any) {
    return {
      data: baseConfig,
      errors: [`JSON parse error: ${err.message}`],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }
};

/**
 * Generates sample CSV template for Farmers
 */
export const getFarmersSampleCSV = (): string => {
  return [
    'Farmer Code,Farmer Name,Phone,Village,Milk Type,Bank Account,IFSC Code',
    '101,Ramesh Patel,9825102931,Anandpur,Cow,918020038411,SBIN0004921',
    '102,Suresh Sharma,9825102932,Anandpur,Buffalo,918020038412,SBIN0004921',
    '103,Gopal Yadav,9825102933,Kalyanpur,Buffalo,918020038413,BARB0ANANDP',
    '104,Mahesh Chaudhary,9825102934,Kalyanpur,Cow,918020038414,HDFC0001290',
    '105,Dinesh Verma,9825102935,Vithalpur,Cow,918020038415,BKID0002100',
    '106,Babulal Dodia,9825102936,Anandpur,Cow,918020038416,SBIN0004921',
    '107,Jagdish Prajapati,9825102937,Kalyanpur,Buffalo,918020038417,BARB0ANANDP',
    '108,Devendra Solanki,9825102938,Vithalpur,Cow,918020038418,HDFC0001290',
  ].join('\n');
};

/**
 * Generates sample JSON for Farmers
 */
export const getFarmersSampleJSON = (): string => {
  return JSON.stringify(
    [
      {
        code: '101',
        name: 'Ramesh Patel',
        phone: '9825102931',
        village: 'Anandpur',
        defaultMilkType: 'Cow',
        bankAccount: '918020038411',
        ifsc: 'SBIN0004921',
      },
      {
        code: '102',
        name: 'Suresh Sharma',
        phone: '9825102932',
        village: 'Anandpur',
        defaultMilkType: 'Buffalo',
        bankAccount: '918020038412',
        ifsc: 'SBIN0004921',
      },
      {
        code: '103',
        name: 'Gopal Yadav',
        phone: '9825102933',
        village: 'Kalyanpur',
        defaultMilkType: 'Buffalo',
        bankAccount: '918020038413',
        ifsc: 'BARB0ANANDP',
      },
    ],
    null,
    2
  );
};

/**
 * Generates sample CSV template for Rate Chart
 */
export const getRateConfigSampleCSV = (config: RateConfig): string => {
  return [
    'Parameter,Value,Description',
    `cowBaseRate,${config.cowBaseRate},Cow Base Rate in INR per Litre`,
    `cowStandardFat,${config.cowStandardFat},Cow Benchmark Fat Percentage`,
    `cowStandardSNF,${config.cowStandardSNF},Cow Benchmark SNF Percentage`,
    `cowFatIncRate,${config.cowFatIncRate},Cow Fat rate difference per 0.1%`,
    `cowSnfIncRate,${config.cowSnfIncRate},Cow SNF rate difference per 0.1%`,
    `buffaloBaseRate,${config.buffaloBaseRate},Buffalo Base Rate in INR per Litre`,
    `buffaloStandardFat,${config.buffaloStandardFat},Buffalo Benchmark Fat Percentage`,
    `buffaloStandardSNF,${config.buffaloStandardSNF},Buffalo Benchmark SNF Percentage`,
    `buffaloFatIncRate,${config.buffaloFatIncRate},Buffalo Fat rate difference per 0.1%`,
    `buffaloSnfIncRate,${config.buffaloSnfIncRate},Buffalo SNF rate difference per 0.1%`,
    `dcsMarginPerLiter,${config.dcsMarginPerLiter},DCS Procurement Handling Margin in INR per Litre`,
    `plantFatKgRate,${config.plantFatKgRate},Apex Chilling Plant Fat Rate per Kg`,
    `plantSnfKgRate,${config.plantSnfKgRate},Apex Chilling Plant SNF Rate per Kg`,
  ].join('\n');
};

/**
 * Generates sample JSON for Rate Chart
 */
export const getRateConfigSampleJSON = (config: RateConfig): string => {
  return JSON.stringify(config, null, 2);
};
