import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';
import { MongoClient } from 'mongodb';
import { CustomProviders } from '@common/nest-common';

describe('UserService', () => {
  let service: UserService;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
      ],
      providers: [
        MONGO_PROVIDER,
        UserService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    mongoClient = module.get(CustomProviders.MONGO_CLIENT);
  });
  //
  afterAll(async () => {
    await mongoClient.close();
  });
  //
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('Create and find user', async () => {
    const result = await service.create({
      password: 'asdasd',
      email: 'test@test9.com',
      username: 'username',
    })

    const found = await service.findExistingUserByEmail(result.email);

    expect(result.email).toEqual(found.email);
  })

  test('', () => expect(true).toBeTruthy())
});
