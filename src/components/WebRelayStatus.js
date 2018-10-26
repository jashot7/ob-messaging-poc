import React from 'react';
import './WebRelayStatus.css';

const WebRelayStatus = props => {
  const isConnected = props.isConnected;

  let className = 'flex row relayStatus fullWidth justify-center';
  className += isConnected ? ' connected' : ' disconnected';
  const text = isConnected ? 'connected' : 'disconnected';
  return (
    <div className={className}>
      <div className="flex column">{text}</div>
    </div>
  )
}

export default WebRelayStatus;