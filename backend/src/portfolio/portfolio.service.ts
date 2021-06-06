import { Injectable } from '@nestjs/common';
import { PortfolioAdjustment, PortfolioStake } from './portfolio.resolver';

@Injectable()
export class PortfolioService {
  private breakdown: Record<string, number> = {};

  public adjustPortfolio(update: PortfolioAdjustment) {
    const stakeholderExists = Object.prototype.hasOwnProperty.call(this.breakdown, update.stakeholder);

    if (!stakeholderExists) {
      if (update.cashUpdate < 0) {
        throw new Error(`Investment stakeholder ${update.stakeholder} does not exist. Unable to reduce stake`);
      }

      // Otherwise, add new stakeholder
      this.breakdown[update.stakeholder] = 0;
    }

    const currentClientStake = this.breakdown[update.stakeholder] * update.currentPortfolioValue;

    // If adding investment, add directly
    // If removing investment, ensure removal is not greater than existing investment
    const adjustedCashUpdate = update.cashUpdate > 0 ? update.cashUpdate : Math.max(-1 * currentClientStake, update.cashUpdate);
    const newClientStake = currentClientStake + adjustedCashUpdate;

    const newTotalPortfolio = update.currentPortfolioValue + adjustedCashUpdate;

    // Updating client portfolio fraction
    const updatedClientFraction = newClientStake / newTotalPortfolio;
    this.breakdown[update.stakeholder] = updatedClientFraction;

    for (const [ stakeholder, currentFraction ] of Object.entries(this.breakdown)) {
      if (stakeholder === update.stakeholder) {
        continue;
      }

      const currentStake = update.currentPortfolioValue * currentFraction;
      const newFraction = currentStake / newTotalPortfolio;
      this.breakdown[stakeholder] = newFraction;
    }

    return this.getPortfolioBreakdown();
  }

  public getPortfolioBreakdown(): PortfolioStake[] {
    return Object.entries(this.breakdown).map(([stakeholder, fraction]) => ({ stakeholder, percentage: fraction * 100 }));
  }
}
