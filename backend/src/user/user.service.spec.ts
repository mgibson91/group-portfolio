import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './user.schema';
import { closeInMongodConnection, rootMongooseTestModule } from '../common/mongo-utils';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: UserModel.name, schema: UserSchema, collection: 'users' }
        ])
      ],
      providers: [
        UserService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('Create and find user', async () => {
    const result = await service.create({
      password: 'asdasd',
      email: 'test@test9.com',
      username: 'username',
    })

    const found = await service.findUserByEmail(result.email);

    expect(result.email).toEqual(found.email);
  })
});
