import "dotenv/config";
import { dirname, importx } from "@discordx/importer";
import { Koa } from "@discordx/koa";
import { bodyParser } from "@koa/bodyparser";

async function run() {
  await importx(
    `${dirname(import.meta.url)}/**/*.{ts,js}`
  );

  // api: prepare server
  const server = new Koa();

  server.use(bodyParser())

  // api: need to build the api server first
  await server.build();

  // api: let's start the server now
  const port = process.env.PORT ?? 3000;
  server.listen(port, () => {
    console.log(`discord api server started on ${port}`);
  });

}

run();
