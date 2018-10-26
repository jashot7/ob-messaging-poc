import React from 'react';
import './ChatMessage.css';
import Avatar from './Avatar';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

const ChatMessage = props => {
  const message = props.chatMessage.message === '' ? 'Blank' : props.chatMessage.message;
  const id = props.chatMessage.id;
  const isOwnMessage = props.chatMessage.isOwnMessage;
  const url = props.url;

  TimeAgo.locale(en);
  const timeAgo = new TimeAgo('en-US');
  const date = timeAgo.format(props.chatMessage.date);

  let className = isOwnMessage ? 'flex row isOwnMessage' : 'flex row';

  let theirContent = (
    <div className={className}>
      <div className="flex column"><Avatar /></div>
      <div className="flex column messageDateContainer">
        <div className="flex column flexVCent pdSm chatMessage">{message}</div>
        <div className="flex column flexVCent chatDate">{date}</div>
      </div>
    </div>
  );

  let isOwnContent = (
    <div className={className}>
     <div className="flex column messageDateContainer">
        <div className="flex column flexVCent pdSm chatMessage">{message}</div>
        <div className="flex column flexVCent chatDate">{date}</div>
      </div>
      <div className="flex column">
        <Avatar url={url} />
      </div>
  </div>
  );

  return isOwnMessage ? isOwnContent : theirContent;
}

export default ChatMessage;