const express = require("express");
const app = express();
const PORT = 5000;
app.use(express.json());
const amqplib = require("amqplib");
const { v4: uuidv4 } = require("uuid");
const controllers = require("./controllers/gateway.controller");

app.post("/rent-bicycle", controllers.sendRentRequest);
app.post("/return-bicycle", controllers.sendReturnRequest);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}...`);
});

// const args = process.argv.slice(2);

// if (args.length == 0) {
//   console.log("Usage: rpc_client.js num");
//   process.exit(1);
// }

// const num = parseInt(args[0]);
