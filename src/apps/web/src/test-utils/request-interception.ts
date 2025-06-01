import { http, HttpResponse } from "msw";
import { SetupServer, setupServer } from "msw/node";
import { expect } from "@map-of-science/vitest";

type ServerOptions = Parameters<typeof setupServer>;
export type HandlerArguments = {
  http: typeof http;
  HttpResponse: typeof HttpResponse;
};

export const withRequestInterception =
  (
    handlers: (args: HandlerArguments) => ServerOptions,
    test: (args: { server: SetupServer } & HandlerArguments) => unknown,
  ) =>
  async () => {
    const resolvedHandlers = handlers({ http, HttpResponse });
    const server = setupServer(...resolvedHandlers);

    server.listen();

    return Promise.resolve(test({ server, http, HttpResponse })).finally(() => {
      server.resetHandlers();
      server.close();
      expect.hasAssertions();
    });
  };
