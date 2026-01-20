/**
 * Formata um valor numérico para moeda brasileira (R$ 1.000,00)
 * Utilizar esta função em todo o sistema para consistência
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Formata porcentagem no padrão brasileiro
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value) + '%';
};
