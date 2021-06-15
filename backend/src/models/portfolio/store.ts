export interface PortfolioStoreModel {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  breakdown: Record<string, number>;
}
