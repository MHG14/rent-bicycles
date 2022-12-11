const amqplib = require("amqplib");
const { v4: uuidv4 } = require("uuid");

exports.sendRentRequest = async (req, res) => {
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const q = await channel.assertQueue("rentBicycleQueue", { exclusive: true });
  const uuid = uuidv4();
  const requestDetails = {
    username: req.body.username,
    bicycleModel: req.body.bicycleModel,
  };

  channel.sendToQueue(
    "rpc_queue",
    Buffer.from(JSON.stringify(requestDetails)),
    {
      replyTo: q.queue,
      correlationId: uuid,
    }
  );

  channel.consume(
    q.queue,
    (msg) => {
      if (msg.properties.correlationId == uuid) {
        console.log(`${msg.content.toString()}`);
        setTimeout(() => {
          connection.close();
          process.exit(0);
        }, 500);
      }
      res.send({ message: msg.content.toString() });
    }
    // { noAck: true }
  );
};
///////////////////////////////////////////////////////////////////////////////

exports.sendReturnRequest = async (req, res) => {
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const q = await channel.assertQueue("returnBicycleQueue", {
    exclusive: true,
  });
  const uuid = uuidv4();
  const requestDetails = {
    username: req.body.username,
    bicycleModel: req.body.bicycleModel,
  };

  console.log(
    `${req.body.username} is returning the bicycle:${req.body.bicycleModel}`
  );

  channel.sendToQueue(
    "rpc_queue",
    Buffer.from(JSON.stringify(requestDetails)),
    {
      replyTo: q.queue,
      correlationId: uuid,
    }
  );

  channel.consume(
    q.queue,
    (msg) => {
      if (msg.properties.correlationId == uuid) {
        setTimeout(() => {
          connection.close();
          process.exit(0);
        }, 500);
      }
    },
    { noAck: true }
  );
  res.send("ok");
};
