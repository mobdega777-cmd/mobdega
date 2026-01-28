import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

/**
 * Retorna a data atual no fuso horário local (Brasil)
 * Evita problemas de UTC que causam datas erradas
 * Usa 12:00 para garantir que a data não mude por causa do fuso
 */
export const getLocalToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
};

/**
 * Retorna o início do dia atual no fuso horário local
 */
export const getLocalStartOfDay = (): Date => {
  return startOfDay(getLocalToday());
};

/**
 * Retorna o fim do dia atual no fuso horário local
 */
export const getLocalEndOfDay = (): Date => {
  return endOfDay(getLocalToday());
};

/**
 * Retorna o início do mês atual no fuso horário local
 */
export const getLocalStartOfMonth = (): Date => {
  return startOfMonth(getLocalToday());
};

/**
 * Retorna um range de datas padrão para filtros (últimos N dias)
 */
export const getDefaultDateRange = (days: number = 30): { start: Date; end: Date } => {
  const today = getLocalToday();
  return {
    start: startOfDay(subDays(today, days - 1)),
    end: endOfDay(today)
  };
};

/**
 * Retorna o range de "hoje" no fuso horário local
 */
export const getTodayDateRange = (): { start: Date; end: Date } => {
  const today = getLocalToday();
  return {
    start: startOfDay(today),
    end: endOfDay(today)
  };
};
