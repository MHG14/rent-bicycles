exports.sendToQueueAndAcknowledge = function (channel, msg, response) {
  channel.sendToQueue(msg.properties.replyTo, Buffer.from(response), {
    correlationId: msg.properties.correlationId,
  });
  channel.ack(msg);
};                                             
