import { RELAY_CONNECTED } from 'actions/webrelay';
import { RELAY_RECEIVE_CHAT_MESSAGE, RELAY_SEND_CHAT_MESSAGE, RELAY_SENT_CHAT_MESSAGE } from '../actions/webrelay';

export const initialState = {
  isRelayConnected: false,
  chatMessages: []
}

function relayConnected(state = {}, action) {
  return {
    ...state,
    isRelayConnected: true
  }
}

function receiveChatMessage(state = {}, action) {
  let chatMessages = state.chatMessages || [];

  chatMessages.push({
    id: action.id,
    message: action.message,
    date: action.date,
    isOwnMessage: false,
  });

  console.log(action.message)
  return {
    ...state,
    chatMessages,
  }
}

function sentChatMessage(state = {}, action) {
  let chatMessages = state.chatMessages || [];

  chatMessages.push({
    id: action.id || 'noChatMessageID',
    message: action.message,
    date: action.date,
    isOwnMessage: true
  });

  return {
    ...state,
    chatMessages
  }
}

export default (state = initialState, action) => {
  switch(action.type) {
    case RELAY_CONNECTED:
      return relayConnected(state, action);
    case RELAY_RECEIVE_CHAT_MESSAGE:
      return receiveChatMessage(state, action);
    case RELAY_SENT_CHAT_MESSAGE:
      return sentChatMessage(state, action);
    default:
      return state;
  }
}