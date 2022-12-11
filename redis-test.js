// const redis = require("redis");

// const client = redis.createClient();

// client.on("error", (err) => console.log("Redis Client Error", err));
// let value;

// const addUser = async () => {
//   await client.connect();

//   await client.set("key", "value");
//   value = await client.get("key");
//   return "ok";
// };

// console.log(value);
const redis = require("redis");

const client = redis.createClient({
  url: "redis://localhost:6379/1",
});

client.connect().then((msg) => console.log("connected to redis!"));

async function redisTest() {
  const random_key = Math.random() * 1000;
  await client.set("user:912123456789", random_key, { EX: 360 });
}

async function getData(keyName) {
  return await client.get(keyName);
}

redisTest();
console.log(getData("user:912123456789"));

module.exports = {
  getData,
};




