import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';
import { MongoClient } from 'mongodb';
import { CustomProviders } from '@common/nest-common';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PortfolioModule } from './portfolio.module';
import { Model } from '../../index';
import { PortfolioRepository } from './portfolio.repository';
import { PersonalStake } from './portfolio.resolver';
import { UserRepository } from '../user/user.repository';

const TestData = {
  User: {
    Admin: {
      username: 'username',
      email: 'email@email.com',
      password: 'password',
    },
    Subscriber1: {
      username: 'username1',
      email: 'email@email1.com',
      password: 'password',
    },
    Subscriber2: {
      username: 'username2',
      email: 'email@email2.com',
      password: 'password',
    },
    Subscriber3: {
      username: 'username3',
      email: 'email@email3.com',
      password: 'password',
    }
  },
  Portfolio: {
    First: {
      name: 'Name',
      description: 'Description',
    },
    Second: {
      name: 'Second',
      description: 'Second',
    },
    Third: {
      name: 'Third',
      description: 'Third',
    }
  }
}

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let portfolioRepository: PortfolioRepository;
  let userService: UserService;
  let mongoClient: MongoClient;

  let userAdmin: Model.User.Public;
  let userSub1: Model.User.Public;
  let userSub2: Model.User.Public;
  let userSub3: Model.User.Public;
  let portfolioFirst: Model.Portfolio.Public;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        PortfolioModule,
      ],
      providers: [
        MONGO_PROVIDER,
        UserRepository,
      ],
    }).compile();

    portfolioRepository = module.get<PortfolioRepository>(PortfolioRepository);
    portfolioService = module.get<PortfolioService>(PortfolioService);
    userService = module.get<UserService>(UserService);

    userAdmin = await userService.create(TestData.User.Admin)
    portfolioFirst = await portfolioService.createPortfolio(TestData.Portfolio.First, userAdmin);

    userSub1 = await userService.create(TestData.User.Subscriber1)
    userSub2 = await userService.create(TestData.User.Subscriber2)
    userSub3 = await userService.create(TestData.User.Subscriber3)

    mongoClient = module.get(CustomProviders.MONGO_CLIENT);
  });

  afterAll(async () => {
    await mongoClient.close();
  });

  it('should be defined', () => {
    expect(portfolioService).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('Standard operations', () => {
    test('Standard user can create portfolio', async () => {
      expect(portfolioFirst.createdBy).toEqual(userAdmin.id);
    })

    test('User can\'t adujst non existent portfolio', async () => {
      await expect(portfolioService.adjustPortfolio({
        currentPortfolioValue: 0,
        cashUpdate: 0,
        portfolioId: 'non-existent',
        userId: userSub1.id,
      }, userAdmin)).rejects.toThrowError(NotFoundException);
    })

    test('User can only add subscribers to portfolios they have created', async() => {
      // Admin can add
      await expect(portfolioService.adjustPortfolio({
        currentPortfolioValue: 0,
        cashUpdate: 0,
        portfolioId: portfolioFirst.id,
        userId: userSub1.id,
      }, userAdmin)).resolves.toMatchObject([
        {
          percentage: 0,
          stakeholder: userSub1.id
        }
      ]);

      // User 2 can't add
      await expect(portfolioService.adjustPortfolio({
        currentPortfolioValue: 0,
        cashUpdate: 0,
        portfolioId: portfolioFirst.id,
        userId: userSub1.id,
      }, userSub2)).rejects.toThrowError(UnauthorizedException);
    })
  })

  test('Basic adding', async () => {
    const portfolio = await portfolioService.createPortfolio(TestData.Portfolio.Second, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub1.id,
      cashUpdate: 1000,
      currentPortfolioValue: 0,
    }, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub2.id,
      cashUpdate: 1000,
      currentPortfolioValue: 1000,
    }, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub3.id,
      cashUpdate: 1000,
      currentPortfolioValue: 2000,
    }, userAdmin);

    const breakdown = await portfolioService.getPortfolioBreakdown({ portfolioId: portfolio.id }, userAdmin);
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id)?.percentage).toPrecision(3)).toEqual('33.3');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id)?.percentage).toPrecision(3)).toEqual('33.3');
    expect(Number(breakdown.find(s => s.stakeholder === userSub3.id)?.percentage).toPrecision(3)).toEqual('33.3');
  });

  test('Add / Remove adding', async () => {
    const portfolio = await portfolioService.createPortfolio(TestData.Portfolio.Third, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub1.id,
      cashUpdate: 1000,
      currentPortfolioValue: 0,
    }, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub2.id,
      cashUpdate: 1500,
      currentPortfolioValue: 1000,
    }, userAdmin);

    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub1.id,
      cashUpdate: -500,
      currentPortfolioValue: 2500,
    }, userAdmin);

    let breakdown = await portfolioService.getPortfolioBreakdown({ portfolioId: portfolio.id }, userAdmin);
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id)?.percentage).toPrecision(3)).toEqual('25.0');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id)?.percentage).toPrecision(3)).toEqual('75.0');

    // With only $500 remaining, a $1000 withdrawal should result in 0 balance
    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub1.id,
      cashUpdate: -1000,
      currentPortfolioValue: 2000,
    }, userAdmin);

    breakdown = await portfolioService.getPortfolioBreakdown({ portfolioId: portfolio.id }, userAdmin);
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id)?.percentage).toPrecision(3)).toEqual('0.00');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id)?.percentage).toPrecision(3)).toEqual('100');
  });

  describe('getPersonalBreakdown', () => {
    test('standard', async () => {
      const mockData: Model.Portfolio.Store[] = [
        {
          _id: 'p-1',
          name: 'P1',
          createdBy: 'admin',
          breakdown: {
            'test-user': 20,
          },
          value: 100,
        },
        {
          _id: 'p-2',
          name: 'P2',
          createdBy: 'admin',
          breakdown: {
            'test-user': 10,
          },
          value: 1000,
        }
      ]
      portfolioRepository.getPersonalPortfolios = jest.fn().mockResolvedValue(mockData);

      const breakdown = await portfolioService.getPersonalBreakdown({
        email: 'test@test.com',
        id: 'test-user',
        username: 'test-user',
      })

      expect(breakdown).toMatchObject([
        {
          portfolio: {
            id: mockData[0]._id,
            name: mockData[0].name,
            value: mockData[0].value,
          },
          percentage: 20,
        },
        {
          portfolio: {
            id: mockData[1]._id,
            name: mockData[1].name,
            value: mockData[1].value,
          },
          percentage: 10,
        }
      ] as PersonalStake[])
    });
  })

  describe('updateValue', () => {
    const mockData: Model.Portfolio.Store = {
      _id: 'p-1',
      name: 'P1',
      createdBy: 'admin',
      breakdown: {
        'test-user': 20,
      },
      value: 100,
    }

    beforeEach(() => {
      portfolioRepository.getExistingPortfolio = jest.fn().mockResolvedValue(mockData);
      portfolioRepository.updateValue = jest.fn().mockResolvedValue({
        ...mockData,
        value: 1000,
      });
    })

    test('User who didnt create portfolio should fail to update', async () => {
      await expect(portfolioService.updateValue({
        portfolioId: 'p-1',
        value: 1000,
      }, {
        email: 'test@test.com',
        id: 'test-user',
        username: 'test',
      }))
        .rejects.toThrowError(UnauthorizedException)
    })

    test('standard', async () => {
      const result = await portfolioService.updateValue({
        portfolioId: 'p-1',
        value: 1000,
      }, {
        email: 'admin@test.com',
        id: 'admin',
        username: 'admin',
      })

      expect(result).toMatchObject({
        ...mockData,
        value: 1000,
      })
    })
  })

  test('Reality', async () => {
    const portfolio = await portfolioService.createPortfolio({
      name: 'Overall',
    }, userAdmin);

    await portfolioService.addSubscriberToPortfolio({ portfolioId: portfolio.id, userId: userSub1.id }, userAdmin);
    await portfolioService.addSubscriberToPortfolio({ portfolioId: portfolio.id, userId: userSub2.id }, userAdmin);
    await portfolioService.addSubscriberToPortfolio({ portfolioId: portfolio.id, userId: userSub3.id }, userAdmin);

    /*
      Initial value: 39376
      C1: 90.23 M
      C2: 6.01 R
      C3: 3.76 T
     */
    await portfolioService.adjustPortfolio({ cashUpdate: 90.23, currentPortfolioValue: 0, portfolioId: portfolio.id, userId: userSub1.id }, userAdmin);
    await portfolioService.adjustPortfolio({ cashUpdate: 6.01, currentPortfolioValue: 90.23, portfolioId: portfolio.id, userId: userSub2.id }, userAdmin);
    await portfolioService.adjustPortfolio({ cashUpdate: 3.76, currentPortfolioValue: (90.23 + 6.01), portfolioId: portfolio.id, userId: userSub3.id }, userAdmin);

    await portfolioService.updateValue({ value: 39376, portfolioId: portfolio.id }, userAdmin);

    await portfolioService.adjustPortfolio({ cashUpdate: -6000, currentPortfolioValue: 39376, portfolioId: portfolio.id, userId: userSub1.id }, userAdmin);

    await portfolioService.adjustPortfolio({ cashUpdate: -306, currentPortfolioValue: 34803, portfolioId: portfolio.id, userId: userSub3.id }, userAdmin);

    await portfolioService.adjustPortfolio({ cashUpdate: 367.667, currentPortfolioValue: 28238.66, portfolioId: portfolio.id, userId: userSub3.id }, userAdmin);
    await portfolioService.adjustPortfolio({ cashUpdate: 2000, currentPortfolioValue: 35000, portfolioId: portfolio.id, userId: userSub3.id }, userAdmin);

    await portfolioService.adjustPortfolio({ cashUpdate: 2870, currentPortfolioValue: 16127, portfolioId: portfolio.id, userId: userSub1.id }, userAdmin);

    await portfolioService.updateValue({ value: 18422, portfolioId: portfolio.id }, userAdmin);
    const breakdown = await portfolioService.getPortfolioBreakdown({ portfolioId: portfolio.id }, userAdmin);
    console.log(breakdown);
  })
});
