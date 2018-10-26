import React, { Component } from 'react';
import LoginRequired from 'components/LoginRequired';
import { connect } from 'react-redux';
import * as UserActions from 'actions/user';
import * as WebrelayActions from 'actions/webrelay';
import Avatar from '../components/Avatar';
import ChatMessage from '../components/ChatMessage';
import WebRelayStatus from '../components/WebRelayStatus';
import './Chat.css';


import { bindActionCreators } from '../../../../Library/Caches/typescript/3.1/node_modules/redux';

class Chat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      phase: 'view',
      form: {
        recipientPeerId: 'QmcFyP1yYjGbLrpxDRZ6PyWygVuLCXcmnwKGjKA7RPGLjQ',
        message: 'Hey! This is a test message from the message relay POC!',
        ...props,
      }
    }

  }
  componentDidMount() {
    // console.log("ChatDidMount");
  }

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.sendChatMessage();
    }
  }

  handleConnectToWebRelay = e => {
    const peerID = this.props.user.profile.peerID;
    this.props.actions.user.connectToWebRelay(peerID);
    e.preventDefault();
  }

  handleSendMessageClick = e => {
    this.sendChatMessage();
    e.preventDefault();
  };

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      form: {
        ...this.state.form,
        [name]: value
      }
    });
  };

  handleMarkMessageRead = chatMessage => {
    this.props.actions.user.markChatMessageRead(chatMessage);
  }

  sendChatMessage() {
    const recipientPeerId = this.state.form.recipientPeerId;
    const message = this.state.form.message;

    this.props.actions.user.sendChatMessage(recipientPeerId, message);

    this.state.form.message = "";
  }

  connectToRelay() {
    this.props.actions.user.connectWS();
  }

  render() {

    const rowClass = this.props.webrelay.isRelayConnected ? 'row' : 'row disabled';
    const rowClassGh = rowClass + " gutterH";
    const connectText = this.props.webrelay.isRelayConnected ? 're-connect' : 'connect';
    const isShowChatContainer = this.props.webrelay.isRelayConnected ? true : false;
    const isNew = true;
    let content;
    if (!this.props.user.loggedIn) {
      content = <LoginRequired />;
    } else {
      content = (
      <div>
        <div className="heading pdSm">Relay Configuration</div>
        <div className="configContainer pdSm mgSm">
          <div className="flex row justify-center">
            <div className="flex column fullWidth">
              <div className="flex row">
                <WebRelayStatus isConnected={this.props.webrelay.isRelayConnected} />
              </div>
              <div className="flex row justify-center">
                <button type="button" onClick={this.handleConnectToWebRelay}>{connectText}</button>
              </div>
            </div>
          </div>
          <div className="flex row justify-center">

            <label htmlFor="recipientPeerId">Recipient Peer Id:</label>
          </div>
          <div className="flex row justify-center">
              <input
                className="fullWidth txtCtr"
                type="text"
                id="recipientPeerId"
                value={this.state.form.recipientPeerId}
                onChange={this.handleInputChange}
                placeholder="Enter recipient Peer ID"
                name="recipientPeerId"
                />

          </div>
      </div>
      <div className={isShowChatContainer ? 'heading pdSm' : 'hide'}>Chat Conversation</div>
      <div className={isShowChatContainer ? 'chatContainer flex column' : 'hide'}>
        <div className="chatHeader pdSm flex row">
          <div className="flex column">
            <Avatar />
          </div>
          <div className="recipientPeerId flex column justify-center">{this.state.form.recipientPeerId}</div>
        </div>

          <div className="chatMessageContainer flex row pdSm mgSm">
            <div className="flex column fullWidth">
              {this.props.webrelay.chatMessages.map(chatMessage => {
                return (<ChatMessage key={chatMessage.messageId}
                                      chatMessage={chatMessage}
                                      url={(this.props.user.profile &&
                                      this.props.user.profile.avatarUrl) ||
                                    ''}/>)})}
            </div>

          </div>
          <div className="chatInputContainer flex row pdSm mgSm">
            <div className="flex column fullWidth pdSm">
              <input
                  className="chatInput pdSm"
                  type="text"
                  id="message"
                  value={this.state.form.message}
                  onChange={this.handleInputChange}
                  placeholder="Enter your message"
                  name="message"
                  onKeyPress={this.handleKeyPress}
                  />
            </div>
            <div className="flex column pdSm">
              <button className="sendButton pdSm" type="button" onClick={this.handleSendMessageClick}>Send</button>
            </div>
          </div>
      </div>
      <div className="chatDebugContainer flex row pdSm mgSm">
            {/* <div>State: ${JSON.stringify(this.state)}</div> */}
            {/* <div>WebRelay: ${JSON.stringify(this.props.webrelay)}</div> */}
          </div>
    </div>
      )
    }
  return content;
  }
}

function mapStateToProps(state, props) {
  return {
    user: state.user,
    webrelay: state.webrelay
  };
}

function mapDispatchToProps(dispatch) {
  return{
    actions: {
      user: bindActionCreators(UserActions, dispatch),
      webrelay: bindActionCreators(WebrelayActions, dispatch)
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Chat);