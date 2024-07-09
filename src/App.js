import React, { useState, useEffect, useCallback, useMemo } from "react";
import PubNub from "pubnub";
import { PubNubProvider } from "pubnub-react";
import { Chat, MessageList, MessageInput } from "@pubnub/react-chat-components";
import emojiData from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

/* create a random username */
const adjectives = ['Happy', 'Clever', 'Brave', 'Calm', 'Eager', 'Gentle', 'Jolly', 'Kind', 'Lively', 'Nice', 'Proud', 'Silly', 'Witty'];
const nouns = ['Panda', 'Tiger', 'Elephant', 'Dolphin', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox', 'Owl', 'Hawk', 'Deer', 'Rabbit'];

function generateUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${noun}${number}`;
}

const myUserName = generateUsername()
const currentChannel = "default";
const theme = "dark"; // or "light"

function App() {
  const pubnub = useMemo(() => {
    const pb = new PubNub({
      publishKey: process.env.REACT_APP_PUBNUB_PUBLISH_KEY,
      subscribeKey: process.env.REACT_APP_PUBNUB_SUBSCRIBE_KEY,
      secretKey: process.env.REACT_APP_PUBNUB_SECRET_KEY,
      userId: myUserName,
    });
    pb.grantToken(
      {
        ttl: 15,
        authorized_uuid: "my-authorized-uuid",
        resources: {
          channels: {
            currentChannel: {
              read: true,
              write: true,
              manage: true,
              delete: true,
            }
          }
        }
      },
      function (status, token) {
        console.log("token received:" + token)
      });

    return pb;
  }, []);

  const onError = (error) => {
    console.log("Error:", error.message, error.status);
  };

  const handleReportUser = (message) => {
    console.log(message)
    console.log("User reported:", message.uuid);
    console.log("Reported message:", message.message.text);
    console.log("Channel:", message.channel);
    console.log("Created at:", message.message.createdAt);
    console.log("Url to chat:", window.location.href)

    pubnub.addMessageAction({
      channel: message.channel,
      messageTimetoken: message.timetoken,
      action: {
        type: 'flagged',
        value: 'message is inappropriate',
      },
    }).then((response) => {
      console.log("Message flagged successfully:", response);
    }).catch((error) => {
      console.error("Error flagging message:", error);
    });
  };

  const handleDeleteMessage = (message) => {
    console.log(message)

    pubnub.addMessageAction({
      channel: message.channel,
      messageTimetoken: message.timetoken,
      action: {
        type: 'deleted',
        value: '.',
      },
    }).then((response) => {
      console.log("Message soft deleted successfully:", response);
    }).catch((error) => {
      console.error("Error soft deleting message:", error);
    });
  };

  useEffect(() => {
    const listener = {
      messageAction: (event) => {
        console.log(event)
        if (event.event === 'added') {
          if (event.data.type === 'deleted') {
            console.log("Message deleted event:", event.data.messageTimetoken);
          } else if (event.data.type === 'flagged') {
            console.log("Message flagged event:", event.data.messageTimetoken);           
          }
        }
      }
    };

    pubnub.addListener(listener);
    pubnub.subscribe({ channels: [currentChannel] });

    return () => {
      pubnub.removeListener(listener);
      pubnub.unsubscribe({ channels: [currentChannel] });
    };
  }, [pubnub]);


  /* custom message renderer */
  const messageRenderer = useCallback(({ message }) => {
   
    // do not display deleted messages
    if (message.actions && message.actions.deleted) {
      return null;
    }

    // our avatar displays the initals of the username
    const getNameInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    // get a color for the avatar
    const getPredefinedColor = (uuid) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const index = uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      return colors[index];
    };

    const uuid = message.uuid || message.publisher || ""; // for history the username is in uuid, for newly posted messages it's in publisher
    const avatarColor = getPredefinedColor(uuid);
    const initials = getNameInitials(uuid);
    const isMyMessage = uuid === myUserName;
    const isFlagged = message.actions && message.actions.flagged;

    // display
    return (
      <div className={`pn-msg ${isMyMessage ? 'pn-msg--own' : ''}`}>
        <div className="pn-msg__avatar" style={{ backgroundColor: avatarColor }}>
          {initials}
        </div>
        <div className="pn-msg__main">
          <div className="pn-msg__content">
            <div className="pn-msg__title">
              <span className="pn-msg__author">{uuid}</span>
            </div>
            {isFlagged && (
              <div className="pn-msg__flagged" style={{ fontSize: '0.8em', color: '#FF6B6B' }}>
                flagged
              </div>
            )}
            <div className="pn-msg__bubble" style={{ fontWeight: isMyMessage ? 'bold' : 'normal' }}>
              {message.message.text}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <PubNubProvider client={pubnub}>
      <Chat {...{ currentChannel, theme, onError }}>
        <MessageList
          fetchMessages={100}
          enableReactions={true}
          reactionsPicker={<Picker data={emojiData} />}
          messageRenderer={messageRenderer}
          extraActionsRenderer={(message) => (
            <>
              <div
                onClick={() => handleReportUser(message)}
                title="Report user"
              >
                <i className="material-icons-outlined">campaign</i>
              </div>
              <div
                onClick={() => handleDeleteMessage(message)}
                title="Delete message"
              >
                <i className="material-icons-outlined">delete</i>
              </div>
            </>
          )}
        />
        <MessageInput emojiPicker={<Picker data={emojiData} />} />
      </Chat>
    </PubNubProvider>
  );
}

export default App;