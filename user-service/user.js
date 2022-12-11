const amqplib = require("amqplib");
const { v4: uuidv4 } = require("uuid");
const utils = require("../rent-service/utils");
const queueName = "rent-to-user-service-queue";
const redis = require("redis");
const client = redis.createClient();
client.connect().then((msg) => console.log("connected to redis!"));

const recieveRequest = async () => {
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: false });
  channel.prefetch(1);
  console.log("Awaiting the requests ...");

  channel.consume(
    queueName,
    async (msg) => {
      const username = msg.content.toString().slice(1, -1);

      const exists = await client.exists(username);
      console.log(exists);

      let result;
      if (exists === 0) {
        result = "USER DOES NOT EXIST";
      } else result = "USER EXISTS";
      utils.sendToQueueAndAcknowledge(channel, msg, result);
    }
    // { noAck: true }
  );
};

recieveRequest();
