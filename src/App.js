/* Imports PubNub JavaScript and React SDKs to create and access PubNub instance across your app. */
/* Imports the required PubNub Chat Components to easily create chat apps with PubNub. */
import React from "react";
import PubNub from "pubnub";
import { PubNubProvider } from "pubnub-react";
import { Chat, MessageList, MessageInput } from "@pubnub/react-chat-components";
import emojiData from "@emoji-mart/data";
import Picker  from "@emoji-mart/react";

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

/* Create PubNub instance*/
const pubnub = new PubNub({
  publishKey: 'pub-c-dc6b6d35-b1b6-45c4-8a0a-5ce8cd792219',
  subscribeKey: 'sub-c-727207b9-420e-4e21-b1ff-ff57ea44f2df',
  secretKey: 'sec-c-ZTBjZGEyMmYtOTc1Yy00ZWNkLTlkZGEtODBkYmUzMGYzZmVm',
  userId: myUserName,
});

const currentChannel = "default";

/* Get an access token to work with Access Manager: In production this would run on the server */
pubnub.grantToken(
  {
    ttl: 15,
    authorized_uuid: "my-authorized-uuid",
    resources: {
      channels: {
        currentChannel: {
          read: true,
          write: true
        }
      }
    }
  },
  function (status, token) {
    console.log("token received:" + token)
  });


const theme = "dark";

/* Display the chat */
function App() {
  return (
    <PubNubProvider client={pubnub}>
      {/* PubNubProvider is a part of the PubNub React SDK and allows you to access PubNub instance
      in components down the tree. */}
      <Chat {...{ currentChannel, theme }}>
        {/* Chat is an obligatory state provider. It allows you to configure some common component
        options, like the current channel and the general theme for the app. */}
          <MessageList 
          fetchMessages={100} // Fetch the last 100 messages
          enableReactions= {true} // Enable reactions
          reactionsPicker={<Picker data={emojiData} />}         
        />
        <MessageInput emojiPicker={<Picker data={emojiData} />}  />
      </Chat>
    </PubNubProvider>
  );
}

export default App;