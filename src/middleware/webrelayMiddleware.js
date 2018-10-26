import { RELAY_REQUEST_CONNECT, RELAY_REQUEST_DISCONNECT, RELAY_SEND_CHAT_MESSAGE }
 from 'actions/webrelay';
import {RELAY_CONNECTED, RELAY_AUTHORIZED, RELAY_AUTHORIZING, RELAY_DISCONNECTED,
   RELAY_ERROR, RELAY_CONNECTING, RELAY_RECEIVE_CHAT_MESSAGE, RELAY_MARK_READ_CHAT_MESSAGE, RELAY_SENT_CHAT_MESSAGE } from '../actions/webrelay';
import { openEncryptedMessage } from '../util/crypto';

const url = "ws://localhost:8080";
let userId;
let subscriptionKey;

const webrelayMiddleware = (function() {
  var socket = null;

  const onOpen = (ws, store) => e => {
    store.dispatch({type: RELAY_CONNECTED});
    store.dispatch({type: RELAY_AUTHORIZING});


    // Generate the authentication message and send it to the relay.
    const authMessage = {
      "UserID": userId,
      "SubscriptionKey":subscriptionKey
    }

    // Outer envelope
    let typedMessage = {
      Type: "SubscriptionMessage",
      Data: authMessage
    }

    const authJson = JSON.stringify(typedMessage);
    socket.send(authJson);
  }

  const onClose = (ws, store) => e => {
    store.dispatch({type: RELAY_DISCONNECTED});
  }

  const onMessage = (ws, store) => e => {
    // Parse the message
    console.log("RX message from web relay:", e.data);
    if (!e.data) {
      store.dispatch({type: RELAY_ERROR, e: 'No JSON provided in message from relay.'});
      return;
    }

    const message = JSON.parse(e.data);

    if (message.subscribe === true) {
      store.dispatch({
        type: RELAY_AUTHORIZED
      })
    } else if (message.encryptedMessage) {
        openEncryptedMessage(message.encryptedMessage).then( (msg) => {
          console.log(msg);

          // If the msg.message is blank, the user is typing I believe.
          // TODO: handle dispatch of user typing message.
          store.dispatch({
            type: RELAY_RECEIVE_CHAT_MESSAGE,
            message: msg.message,
            id: message.id,
            date: new Date(Date.parse("12-12-2018"))
          })
        });
    }
  }
  const markChatMessageRead = (messageId) => {

    const ackMessage = {
      messageId
    }

    let typedMessage = {
      Type: "AckMessage",
      Data: ackMessage
    }

    const messageJson = JSON.stringify(typedMessage);
    socket.send(messageJson);
  }
  const sendChatMessage = (action, store) => {

    let chatMessage = {
      encryptedMessage: action.encryptedMessage,
      recipient: action.recipient,
    }

    // Generate the authentication message and send it to the relay.
    let typedMessage = {
      Type: "EncryptedMessage",
      Data: chatMessage
    }

    let messageJson = JSON.stringify(typedMessage);
    // console.debug({messageJson});
    socket.send(messageJson);

    // Notify that we've sent a chat message
    store.dispatch({
      type: RELAY_SENT_CHAT_MESSAGE,
      message: action.message,
      date: action.date,
      messageId: action.messageId,
    })
  }

  return store => next => action => {
    switch(action.type) {
      case RELAY_REQUEST_CONNECT:
        if (socket != null) {
          socket.close();
        }

        store.dispatch({type: RELAY_CONNECTING});

        userId = action.userId;
        subscriptionKey = action.subscriptionKey;

        socket = new WebSocket(url);
        socket.onopen = onOpen(socket, store);
        socket.onclose = onClose(socket, store);
        socket.onmessage = onMessage(socket, store);

        break;

      case RELAY_REQUEST_DISCONNECT:
        if (socket != null) {
          socket.close();
        }
        socket = null;

        store.dispatch({type: RELAY_REQUEST_DISCONNECT});
        break;

      case RELAY_SEND_CHAT_MESSAGE:
        sendChatMessage(action, store);
        break;
      case RELAY_MARK_READ_CHAT_MESSAGE:
        markChatMessageRead(action.messageId);

      default:
        // Ignore this message, its not for us!
        return next(action);
    }
  }
})();

export default webrelayMiddleware;