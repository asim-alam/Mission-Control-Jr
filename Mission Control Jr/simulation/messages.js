/** A teaching packet waits for a link before departure and, if necessary, at reception. */
export function createMessage({id, createdAt, outboundSeconds, processingSeconds, inboundSeconds, payload, channel = 'earth'}) {
  if (!id || ![createdAt,outboundSeconds,processingSeconds,inboundSeconds].every(n => Number.isFinite(n) && n >= 0)) throw new RangeError('Invalid message');
  return {id, channel, createdAt, outboundSeconds, processingSeconds, inboundSeconds, payload, status:'queued', departureAt:null, earthReceivedAt:null, replyDepartedAt:null, arrivalAt:null, deliveredAt:null};
}
export function updateMessage(message, now, linkAvailable = true) {
  if (!Number.isFinite(now) || now < message.createdAt) throw new RangeError('Invalid message time');
  if (message.status === 'delivered') return message;
  if (message.departureAt == null && linkAvailable) {
    message.departureAt = now;
    message.earthReceivedAt = now + message.outboundSeconds;
    message.replyDepartedAt = message.earthReceivedAt + message.processingSeconds;
    message.arrivalAt = message.replyDepartedAt + message.inboundSeconds;
  }
  if (message.departureAt == null) message.status = 'queued';
  else if (now < message.earthReceivedAt) message.status = 'outbound';
  else if (now < message.replyDepartedAt) message.status = 'processing';
  else if (now < message.arrivalAt) message.status = 'returning';
  else if (!linkAvailable) message.status = 'reception-blocked';
  else { message.status = 'delivered'; message.deliveredAt = now; }
  return message;
}
