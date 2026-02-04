import { startOfDay, endOfDay, subDays, startOfMonth, format } from "date-fns";

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

/**
 * Retorna o range do mês atual (do dia 1 até hoje) no fuso horário local
 */
export const getThisMonthDateRange = (): { start: Date; end: Date } => {
  const today = getLocalToday();
  return {
    start: startOfDay(startOfMonth(today)),
    end: endOfDay(today)
  };
};

/**
 * Converte uma data local para string ISO compatível com queries Supabase
 * Adiciona o offset correto do timezone Brasil (UTC-3)
 * 
 * @param date - Data local a ser convertida
 * @param isEndOfDay - Se true, considera 23:59:59, senão 00:00:00
 * @returns String ISO no formato esperado pelo Supabase
 */
export const toSupabaseISOString = (date: Date, isEndOfDay: boolean = false): string => {
  // Extrai componentes locais da data
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (isEndOfDay) {
    // Fim do dia: 23:59:59.999 no horário local, convertido para UTC (+3 horas)
    // Equivale a meia-noite do dia seguinte menos 1ms em UTC
    return `${year}-${month}-${day}T23:59:59.999-03:00`;
  } else {
    // Início do dia: 00:00:00 no horário local, convertido para UTC (+3 horas)
    return `${year}-${month}-${day}T00:00:00.000-03:00`;
  }
};

/**
 * Retorna o range de datas formatado para queries Supabase
 * Usa o timezone correto do Brasil (UTC-3)
 */
export const getSupabaseDateRange = (start: Date, end: Date): { startISO: string; endISO: string } => {
  return {
    startISO: toSupabaseISOString(start, false),
    endISO: toSupabaseISOString(end, true)
  };
};
