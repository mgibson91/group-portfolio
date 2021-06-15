import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';
import { MongoClient } from 'mongodb';
import { CustomProviders } from '@common/nest-common';

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
  let userService: UserService;
  let mongoClient: MongoClient;

  let userAdmin;
  let userSub1;
  let userSub2;
  let userSub3;
  let portfolioFirst;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
      ],
      providers: [
        PortfolioService,
        UserService,
        MONGO_PROVIDER,
      ],
    }).compile();

    portfolioService = module.get<PortfolioService>(PortfolioService);
    userService = module.get<UserService>(UserService);

    userAdmin = await userService.create(TestData.User.Admin)
    portfolioFirst = await portfolioService.createPortfolio(TestData.Portfolio.First, userAdmin);

    userSub1 = await userService.create(TestData.User.Subscriber1)
    userSub2 = await userService.create(TestData.User.Subscriber2)
    userSub3 = await userService.create(TestData.User.Subscriber3)

    mongoClient = module.get(CustomProviders.MONGO_CLIENT);
  });

  afterEach(async () => {
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
        userId: userSub1,
      }, userAdmin)).rejects.toThrowError();
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
      }, userSub2)).rejects.toThrowError();
    })
  })

  test('Basic adding', async () => {
    const portfolio =  await portfolioService.createPortfolio(TestData.Portfolio.Second, userAdmin);

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
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id).percentage).toPrecision(3)).toEqual('33.3');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id).percentage).toPrecision(3)).toEqual('33.3');
    expect(Number(breakdown.find(s => s.stakeholder === userSub3.id).percentage).toPrecision(3)).toEqual('33.3');
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
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id).percentage).toPrecision(3)).toEqual('25.0');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id).percentage).toPrecision(3)).toEqual('75.0');

    // With only $500 remaining, a $1000 withdrawal should result in 0 balance
    await portfolioService.adjustPortfolio({
      portfolioId: portfolio.id,
      userId: userSub1.id,
      cashUpdate: -1000,
      currentPortfolioValue: 2000,
    }, userAdmin);

    breakdown = await portfolioService.getPortfolioBreakdown({ portfolioId: portfolio.id }, userAdmin);
    expect(Number(breakdown.find(s => s.stakeholder === userSub1.id).percentage).toPrecision(3)).toEqual('0.00');
    expect(Number(breakdown.find(s => s.stakeholder === userSub2.id).percentage).toPrecision(3)).toEqual('100');
  });
});
