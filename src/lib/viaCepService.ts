// ViaCEP API Service
// Free Brazilian postal code lookup service

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Fetch address data from ViaCEP API
 * @param cep - CEP string (with or without formatting)
 * @returns Address data or null if not found
 */
export const fetchAddressByCep = async (cep: string): Promise<AddressData | null> => {
  try {
    // Remove any non-digit characters
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return null;
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
};

/**
 * Validate if a CEP exists
 * @param cep - CEP string to validate
 * @returns true if valid, false otherwise
 */
export const validateCep = async (cep: string): Promise<boolean> => {
  const address = await fetchAddressByCep(cep);
  return address !== null;
};

/**
 * Check if a CEP is within a given range
 * CEPs in Brazil are geographically ordered, so numeric comparison works
 * @param cep - CEP to check
 * @param cepStart - Start of range (inclusive)
 * @param cepEnd - End of range (inclusive)
 * @returns true if CEP is within range
 */
export const isCepInRange = (cep: string, cepStart: string, cepEnd: string): boolean => {
  const cleanCep = parseInt(cep.replace(/\D/g, ''), 10);
  const start = parseInt(cepStart.replace(/\D/g, ''), 10);
  const end = parseInt(cepEnd.replace(/\D/g, ''), 10);

  if (isNaN(cleanCep) || isNaN(start) || isNaN(end)) {
    return false;
  }

  return cleanCep >= start && cleanCep <= end;
};

/**
 * Format CEP with mask (00000-000)
 * @param cep - Raw CEP string
 * @returns Formatted CEP
 */
export const formatCep = (cep: string): string => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length <= 5) {
    return clean;
  }
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
};

/**
 * Get the first 5 digits of a CEP (region identifier)
 * CEPs with the same first 5 digits are typically in the same city/region
 * @param cep - CEP string
 * @returns First 5 digits or empty string if invalid
 */
export const getCepRegion = (cep: string): string => {
  const clean = cep.replace(/\D/g, '');
  return clean.slice(0, 5);
};

/**
 * Check if two CEPs are in the same region (same first 5 digits)
 * @param cep1 - First CEP
 * @param cep2 - Second CEP
 * @returns true if same region
 */
export const areCepsInSameRegion = (cep1: string, cep2: string): boolean => {
  return getCepRegion(cep1) === getCepRegion(cep2);
};

/**
 * Calculate proximity score between two CEPs
 * Lower score = closer proximity
 * @param cep1 - First CEP
 * @param cep2 - Second CEP
 * @returns Proximity score (0 = same CEP, higher = further apart)
 */
export const getCepProximityScore = (cep1: string, cep2: string): number => {
  const num1 = parseInt(cep1.replace(/\D/g, ''), 10);
  const num2 = parseInt(cep2.replace(/\D/g, ''), 10);

  if (isNaN(num1) || isNaN(num2)) {
    return Infinity;
  }

  return Math.abs(num1 - num2);
};