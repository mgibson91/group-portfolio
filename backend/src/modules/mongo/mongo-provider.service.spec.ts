import { Test, TestingModule } from '@nestjs/testing';
import { CustomProviders } from '@common/nest-common';
import { MongoClient } from 'mongodb';
import { MONGO_PROVIDER } from './mongo.provider';

describe('MongoService', () => {
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const fixture: TestingModule = await Test.createTestingModule({
      providers: [MONGO_PROVIDER],
    }).compile();

    mongoClient = fixture.get(CustomProviders.MONGO_CLIENT);
  })

  afterAll(async () => {
    await mongoClient.close();
  })

  it('should be defined', () => {
    expect(mongoClient).toBeDefined();
  });

  it('Should be able to create and delete a document', async () => {
    const testEntry = await mongoClient.db().collection('test-entries').insertOne({
      field1: 'value1',
    })

    const queriedEntry = await mongoClient.db().collection('test-entries').findOne({
      field1: 'value1',
    })

    console.log(queriedEntry);

    expect(testEntry.insertedId).toEqual(queriedEntry._id)
    expect(queriedEntry.field1).toEqual('value1')
  })
});
