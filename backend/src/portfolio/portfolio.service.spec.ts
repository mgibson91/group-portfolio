import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioService],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // test('Basic adding', () => {
  //   service.adjustPortfolio({
  //
  //     stakeholder: 'matt',
  //     cashUpdate: 1000,
  //     currentPortfolioValue: 0,
  //   });
  //
  //   service.adjustPortfolio({
  //     stakeholder: 'raymond',
  //     cashUpdate: 1000,
  //     currentPortfolioValue: 1000,
  //   });
  //
  //   service.adjustPortfolio({
  //     stakeholder: 'tim',
  //     cashUpdate: 1000,
  //     currentPortfolioValue: 2000,
  //   });
  //
  //   const breakdown = service.getPortfolioBreakdown();
  //   expect(Number(breakdown.find(s => s.stakeholder === 'matt').percentage).toPrecision(3)).toEqual('33.3');
  //   expect(Number(breakdown.find(s => s.stakeholder === 'raymond').percentage).toPrecision(3)).toEqual('33.3');
  //   expect(Number(breakdown.find(s => s.stakeholder === 'tim').percentage).toPrecision(3)).toEqual('33.3');
  // });

  // test('Add / Remove adding', () => {
  //   service.adjustPortfolio({
  //     stakeholder: 'matt',
  //     cashUpdate: 1000,
  //     currentPortfolioValue: 0,
  //   });
  //
  //   service.adjustPortfolio({
  //     stakeholder: 'raymond',
  //     cashUpdate: 1500,
  //     currentPortfolioValue: 1000,
  //   });
  //
  //   service.adjustPortfolio({
  //     stakeholder: 'matt',
  //     cashUpdate: -500,
  //     currentPortfolioValue: 2500,
  //   });
  //
  //   let breakdown = service.getPortfolioBreakdown();
  //   expect(Number(breakdown.find(s => s.stakeholder === 'matt').percentage).toPrecision(3)).toEqual('25.0');
  //   expect(Number(breakdown.find(s => s.stakeholder === 'raymond').percentage).toPrecision(3)).toEqual('75.0');
  //
  //   // With only $500 remaining, a $1000 withdrawal should result in 0 balance
  //   service.adjustPortfolio({
  //     stakeholder: 'matt',
  //     cashUpdate: -1000,
  //     currentPortfolioValue: 2000,
  //   });
  //
  //   breakdown = service.getPortfolioBreakdown();
  //   expect(Number(breakdown.find(s => s.stakeholder === 'matt').percentage).toPrecision(3)).toEqual('0.00');
  //   expect(Number(breakdown.find(s => s.stakeholder === 'raymond').percentage).toPrecision(3)).toEqual('100');
  // });
});
