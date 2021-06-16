import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioRepository } from './portfolio-repository.service';

describe('PortfolioRepositoryService', () => {
  let service: PortfolioRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortfolioRepository],
    }).compile();

    service = module.get<PortfolioRepository>(PortfolioRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
