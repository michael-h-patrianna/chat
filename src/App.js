import React, { useEffect, useCallback, useMemo } from "react";
import PubNub from "pubnub";
import { PubNubProvider } from "pubnub-react";
import { Chat, MessageList, MessageInput } from "@pubnub/react-chat-components";
import emojiData from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import "./index.css";

// Arrays for generating random usernames
const adjectives = ['Happy', 'Clever', 'Brave', 'Calm', 'Eager', 'Gentle', 'Jolly', 'Kind', 'Lively', 'Nice', 'Proud', 'Silly', 'Witty'];
const nouns = ['Panda', 'Tiger', 'Elephant', 'Dolphin', 'Eagle', 'Lion', 'Wolf', 'Bear', 'Fox', 'Owl', 'Hawk', 'Deer', 'Rabbit'];

// Function to generate a random username
function generateUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${noun}${number}`;
}

// Generate a random username for the current user
const myUserName = generateUsername()

// Set the channel name and theme
const currentChannel = "default";
const theme = "dark"; // or "light"

// Main App component
function App() {
  // Create the PubNub client instance
  const pubnub = useMemo(() => {
    const pb = new PubNub({
      publishKey: process.env.REACT_APP_PUBNUB_PUBLISH_KEY,
      subscribeKey: process.env.REACT_APP_PUBNUB_SUBSCRIBE_KEY,
      secretKey: process.env.REACT_APP_PUBNUB_SECRET_KEY,
      userId: myUserName,
    });

    // Grant access token for the user (should be done on the backend in production)
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

  // Error handler for PubNub operations
  const onError = (error) => {
    console.log("Error:", error.message, error.status);
  };

  // Handler for reporting a user
  const handleReportUser = useCallback((message) => {
    console.log("User reported:", message.uuid);
    console.log("Reported message:", message.message.text);
    console.log("Channel:", message.channel);
    console.log("Created at:", message.message.createdAt);
    console.log("Url to chat:", window.location.href)

    // Flag the message as reported
    pubnub.addMessageAction({
      channel: message.channel,
      messageTimetoken: message.timetoken,
      action: {
        type: 'reported',
        value: 'message is inappropriate',
      },
    }).then((response) => {
      console.log("Message flagged successfully:", response);
    }).catch((error) => {
      console.error("Error flagging message:", error);
    });
  }, [pubnub]); // Add pubnub as a dependency

  // Handler for soft-deleting a message
  const handleDeleteMessage = useCallback((message) => {
    // Soft-delete by flagging the message as "deleted"
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
  }, [pubnub]); // Add pubnub as a dependency

  // Set up PubNub listener and subscription
  useEffect(() => {
    // Listen for message actions (e.g., flagging, deletion)
    const listener = {
      messageAction: (event) => {
        if (event.event === 'added') {
          if (event.data.type === 'deleted') {
            console.log("Message deleted event:", event.data.messageTimetoken);
          } else if (event.data.type === 'reported') {
            console.log("Message reported event:", event.data.messageTimetoken);
          }
        }
      }
    };

    pubnub.addListener(listener);

    // Subscribe to the current channel
    pubnub.subscribe({ channels: [currentChannel] });

    // Cleanup function
    return () => {
      pubnub.removeListener(listener);
      pubnub.unsubscribe({ channels: [currentChannel] });
    };
  }, [pubnub]); // Add pubnub as a dependency

  // Custom message renderer
  const messageRenderer = useCallback(({ message }) => {
    // Don't display deleted messages
    if (message.actions && message.actions.deleted) {
      return null;
    }

    // Generate initials for the avatar
    const getNameInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    // Generate a color for the avatar based on the user's UUID
    const getPredefinedColor = (uuid) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
      const index = uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      return colors[index];
    };

    const uuid = message.uuid || message.publisher || "";
    const avatarColor = getPredefinedColor(uuid);
    const initials = getNameInitials(uuid);
    const isMyMessage = uuid === myUserName;
    const isFlagged = message.actions && message.actions.reported;


    // Render emoji reactions
    const renderReactions = () => {
      if (!message.actions || !message.actions.reaction) return null;

      return (
        <div className="pn-msg__reactions">
          {Object.entries(message.actions.reaction).map(([emoji, users]) => (
            <span key={emoji} className="pn-msg__reaction" title={users.map(u => u.uuid).join(', ')}>
              {emoji} {users.length}
            </span>
          ))}
        </div>
      );
    };


    // Render the message
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
                reported
              </div>
            )}
            <div className="pn-msg__bubble" style={{ fontWeight: isMyMessage ? 'bold' : 'normal' }}>
              {message.message.text}
            </div>
            {renderReactions()}
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <PubNubProvider client={pubnub}>
      <Chat {...{ currentChannel, theme, onError }}>
        <MessageList
          fetchMessages={100} // Fetch the last 100 messages
          enableReactions={true} // Allow users to react with emojis
          reactionsPicker={<Picker data={emojiData} />} // Use emojiData to pick emojis
          messageRenderer={messageRenderer} // Use our custom message renderer
          extraActionsRenderer={(message) => ( // Add extra action buttons to each message
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
        <MessageInput
          emojiPicker={<Picker data={emojiData} />}  // Use emojiData as picker and make it accessible via a button next to the message input field
        />
      </Chat>
    </PubNubProvider>
  );
}

export default App;