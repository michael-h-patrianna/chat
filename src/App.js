import React, { useEffect, useState } from "react";
import PubNub from "pubnub";
import { PubNubProvider, usePubNub } from "pubnub-react";
import { Chat, MessageList, MessageInput } from "@pubnub/react-chat-components";

// Assume this comes from your authentication system
const authenticatedUser = {
  id: "user1",
  name: "Alice",
  authToken: "user1-auth-token"
};

const pubnub = new PubNub({
  publishKey: 'pub-c-dc6b6d35-b1b6-45c4-8a0a-5ce8cd792219',
  subscribeKey: 'sub-c-727207b9-420e-4e21-b1ff-ff57ea44f2df',
  userId: authenticatedUser.id,
  authKey: authenticatedUser.authToken,
});

const currentChannel = "Default";
const theme = "light";

function ChatComponent() {
  const pubnub = usePubNub();
  const [hasPostedHello, setHasPostedHello] = useState(false);

  useEffect(() => {
    pubnub.subscribe({ channels: [currentChannel] });

    // Fake user posts "Hello Chat"
    if (!hasPostedHello) {
      const fakeUser = {
        id: "fakeUser",
        name: "Fake User"
      };

      pubnub.publish({
        channel: currentChannel,
        message: {
          type: "text",
          text: "Hello Chat!",
          sender: fakeUser,
        },
      }).then(() => setHasPostedHello(true));
    }

    return () => {
      pubnub.unsubscribe({ channels: [currentChannel] });
    };
  }, [pubnub, hasPostedHello]);

  return (
    <Chat currentChannel={currentChannel} theme={theme}>
      <MessageList />
      <MessageInput />
    </Chat>
  );
}

function App() {
  return (
    <PubNubProvider client={pubnub}>
      <ChatComponent />
    </PubNubProvider>
  );
}

export default App;