const amqplib = require("amqplib");
const { v4: uuidv4 } = require("uuid");

const queueName = "rpc_queue";
const { sendToQueueAndAcknowledge } = require("./utils");

const recieveRequests = async () => {
  try {
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: false });
    channel.prefetch(1);
    console.log("Awaiting the requests ...");

    channel.consume(
      queueName,
      async (msg) => {
        const rentRequestDetails = JSON.parse(msg.content);
        const username = rentRequestDetails.username;
        const bicycleModel = rentRequestDetails.bicycleModel;

        if (msg.properties.replyTo === "rentBicycleQueue") {
          console.log(
            `${rentRequestDetails.username} has sent a new rent request for ${rentRequestDetails.bicycleModel}`
          );

          //////////////////////////////////////////////////////////////////////////////
          // Declaring the function which calls the user service and gives back a response
          const callUserService = async (username, channel, message) => {
            const connection = await amqplib.connect("amqp://localhost");
            const ch = await connection.createChannel();
            const q = await ch.assertQueue("userExistanceInquiry", {
              exclusive: false,
            });
            const uuid = uuidv4();

            ch.sendToQueue(
              "rent-to-user-service-queue",
              Buffer.from(JSON.stringify(username)),
              {
                replyTo: q.queue,
                correlationId: uuid,
              }
            );

            // Dealing with the response coming from the user service
            ch.consume(
              q.queue,
              async (msg) => {
                const response = msg.content.toString();
                if (msg.properties.correlationId == uuid) {
                  if (response === "USER EXISTS") {
                    const callBicycleService = async (
                      bicycleModel,
                      channel,
                      message
                    ) => {
                      const connection = await amqplib.connect(
                        "amqp://localhost"
                      );
                      const ch = await connection.createChannel();
                      const q = await ch.assertQueue(
                        "bicycleInventoryInquiry",
                        {
                          exclusive: false,
                        }
                      );
                      const uuid = uuidv4();

                      ch.sendToQueue(
                        "rent-to-bicycle-service-queue",
                        Buffer.from(JSON.stringify(bicycleModel)),
                        {
                          replyTo: q.queue,
                          correlationId: uuid,
                        }
                      );

                      // Dealing with the response coming from the bicycle service
                      ch.consume(q.queue, async (msg) => {
                        const response = msg.content.toString();
                        if (msg.properties.correlationId == uuid) {
                          sendToQueueAndAcknowledge(channel, msg, response);
                        }
                        // { noAck: true }
                      });
                    };
                    await callBicycleService(bicycleModel, channel, msg);
                  }
                } else if (response === "USER DOES NOT EXIST") {
                  sendToQueueAndAcknowledge(channel, message, response);
                  setTimeout(() => {
                    connection.close();
                    process.exit(0);
                  }, 500);
                }
              }
              // { noAck: true }
            );
          };
          //////////////////////////////////////////////////////////////////////////////////
          await callUserService(username, channel, msg);

          ////////////////////////////////////////////////////////////////////////////////////
        } else if (msg.properties.replyTo === "returnBicycleQueue") {
          sendToQueueAndAcknowledge(channel, msg, "Bicycle is returned");
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(error.message);
  }
};

recieveRequests();
