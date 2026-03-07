// Plan feature labels mapping - used in AuthModal, UpgradeModal, and Admin panels
export const menuItemLabels: Record<string, string> = {
  cashregister: "Caixa/PDV",
  orders: "Gestão de Pedidos",
  delivery: "Delivery",
  deliveryzones: "Áreas de Entrega",
  tables: "Mesas/Comandas",
  products: "Produtos",
  categories: "Categorias",
  stockcontrol: "Controle de Estoque",
  financial: "Financeiro",
  coupons: "Cupons para Clientes",
  customers: "Clientes",
  photos: "Fotos",
  paymentconfig: "Configuração de Pagamentos",
  contract: "Contrato",
  training: "Treinamento",
  expenses: "Despesas/Gastos",
};

// Items that are always included and shouldn't be shown as "features"
const excludedItems = ['overview', 'settings'];

/**
 * Converts allowed_menu_items array to human-readable feature labels
 * for display in plan cards (registration, upgrade modal, etc.)
 */
export const getFeatureLabels = (allowedItems: string[]): string[] => {
  if (!Array.isArray(allowedItems)) return [];
  
  return allowedItems
    .filter(item => !excludedItems.includes(item))
    .map(item => menuItemLabels[item])
    .filter(Boolean);
};

/**
 * Gets the first N feature labels for compact display
 */
export const getTopFeatureLabels = (allowedItems: string[], limit: number = 6): string[] => {
  return getFeatureLabels(allowedItems).slice(0, limit);
};

/**
 * Checks if a specific feature is allowed in the plan
 */
export const isPlanFeatureAllowed = (allowedItems: string[], feature: string): boolean => {
  if (!Array.isArray(allowedItems)) return false;
  return allowedItems.includes(feature);
};
