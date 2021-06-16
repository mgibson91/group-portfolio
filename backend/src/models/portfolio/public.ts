export interface PortfolioPublicModel {
  id: string;
  name: string;
  description?: string;
  value: number;
  createdBy: string;
  breakdown: Record<string, number>;
}
