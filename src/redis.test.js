const { expect } = require('chai');

const redis = require("async-redis");
const { GenericContainer } = require("testcontainers");

describe("redis", () => {
  let container;
  let redisClient;

  before(async function () {
    const mochaContext = this;
    mochaContext.timeout(60000);
    container = await new GenericContainer("redis")
      .withExposedPorts(6379)
      .start();

    redisClient = redis.createClient(
      container.getMappedPort(6379),
      container.getHost(),
    );
  });

  after(async () => {
    await redisClient.quit();
    await container.stop();
  });

  it("works", async () => {
    await redisClient.set("key", "val");
    expect(await redisClient.get("key")).to.equal("val");
  });
});