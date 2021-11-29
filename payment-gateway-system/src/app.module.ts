import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { CoreModule } from './core/core.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      include: [PaymentsModule],
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams: { [key: string]: any }) => {
            // workaround to make the JwtAuthGuard works with graphql subscription
            return { req: { headers: connectionParams } };
          },
        },
      },
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    CoreModule,
    PaymentsModule,
  ],
})
export class AppModule {}
