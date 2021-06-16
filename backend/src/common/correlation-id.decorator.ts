import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { v4 as uuid } from "uuid";

export const CorrelationId = createParamDecorator((data: unknown, context: ExecutionContext): string => {
  try {
    const req = context.switchToHttp().getRequest();
    if (req) {
      return req.correlationId ?? uuid();
    }
    // Must be GQL...
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.headers['correlation-id'] ?? uuid();
  } catch {
    // Anything else...
    return uuid();
  }
});
