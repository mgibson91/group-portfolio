import { Provider } from '@nestjs/common';
import { CustomProviders } from '@common/nest-common';
import { MongoClient } from 'mongodb';

let mongoClient: MongoClient;

export const MONGO_PROVIDER: Provider = {
  provide: CustomProviders.MONGO_CLIENT,
  useFactory: async () =>
    new Promise(async (resolve, reject) => {
      try {
        if (mongoClient) {
          // console.log('Returning existing client');
          return resolve(mongoClient);
        }

        // console.log('Connecting to Mongo');
        mongoClient = await MongoClient.connect(
          // In testing, jest.global.setup.ts overwrites MONGO_URI to point to mongodb-memory-server
          process.env.MONGO_URI as string,
          {
            useUnifiedTopology: true,
          },
        );
        resolve(mongoClient);
      }
      catch (err) {
        console.error(err, 'Couldn\'t connect to mongo');
        reject(err);
      }
    }),
};
