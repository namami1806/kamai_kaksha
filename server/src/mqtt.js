import aedes from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { parseAuthToken } from './auth.js';

/**
 * Embedded Aedes MQTT Broker with Per-Student Token Auth & Topic ACLs (Requirement 8)
 *
 * Topic Hierarchy:
 * - kk/students/{studentId}/progress : Student progress events (QoS 1)
 * - kk/students/{studentId}/alerts   : Student personal alert notices
 * - kk/students/+/progress           : Facilitator wildcard subscription
 */
export function setupMQTTBroker(httpServer) {
  const broker = aedes();

  // 1. Authentication Hook
  broker.authenticate = function (client, username, password, callback) {
    const tokenStr = password ? password.toString() : username;
    const auth = parseAuthToken(`Bearer ${tokenStr}`);

    if (!auth) {
      console.warn(`[MQTT Auth] Connection rejected for client ${client.id} (Invalid token)`);
      const error = new Error('MQTT Auth Failed: Invalid student token or facilitator secret');
      error.returnCode = 4; // Bad user name or password
      return callback(error, false);
    }

    client.role = auth.role;
    client.studentId = auth.studentId || auth.id;
    console.log(`[MQTT Auth] Authenticated client ${client.id} as ${client.role} (${client.studentId})`);
    callback(null, true);
  };

  // 2. Authorize Publish (Topic ACL)
  broker.authorizePublish = function (client, packet, callback) {
    if (!client) return callback(null); // Internal broker packets

    const topic = packet.topic;

    // Facilitator can publish to any topic
    if (client.role === 'facilitator') {
      return callback(null);
    }

    // Student can ONLY publish to their own topic: kk/students/{client.studentId}/#
    const expectedPrefix = `kk/students/${client.studentId}/`;
    if (topic.startsWith(expectedPrefix)) {
      return callback(null);
    }

    console.warn(`[MQTT ACL] Publish DENIED: Student '${client.studentId}' attempted to publish to '${topic}'`);
    const error = new Error(`ACL Violation: You are only authorized to publish to ${expectedPrefix}#`);
    return callback(error);
  };

  // 3. Authorize Subscribe (Topic ACL)
  broker.authorizeSubscribe = function (client, sub, callback) {
    const topic = sub.topic;

    // Wildcard subscriptions (kk/students/+/progress, etc.) require Facilitator role
    const isWildcard = topic.includes('+') || topic.includes('#');

    if (client.role === 'facilitator') {
      return callback(null, sub);
    }

    // Non-facilitator (student) attempting wildcard subscribe is strictly denied
    if (isWildcard) {
      console.warn(`[MQTT ACL] Wildcard Subscribe DENIED: Student '${client.studentId}' attempted wildcard '${topic}'`);
      return callback(new Error('ACL Violation: Wildcard subscription restricted to facilitator role only'));
    }

    // Student can only subscribe to their own specific topic
    const expectedPrefix = `kk/students/${client.studentId}/`;
    if (topic.startsWith(expectedPrefix)) {
      return callback(null, sub);
    }

    console.warn(`[MQTT ACL] Subscribe DENIED: Student '${client.studentId}' attempted to subscribe to '${topic}'`);
    return callback(new Error(`ACL Violation: Restricted to ${expectedPrefix}#`));
  };

  // 4. Attach WebSocket Server over HTTP on path /mqtt
  const wss = new WebSocketServer({ server: httpServer, path: '/mqtt' });

  wss.on('connection', (ws) => {
    const stream = createWebSocketStream(ws);
    broker.handle(stream);
  });

  console.log('[Kamai MQTT] Aedes MQTT broker running over WebSockets on /mqtt');

  return {
    broker,
    publishTelemetryEvent: (studentId, event) => {
      const topic = `kk/students/${studentId}/progress`;
      const payload = Buffer.from(JSON.stringify({
        ...event,
        studentId,
        timestamp: new Date().toISOString()
      }));

      broker.publish({
        topic,
        payload,
        qos: 1,
        retain: false
      }, (err) => {
        if (err) console.warn('[MQTT Publish Error]', err);
      });
    }
  };
}
