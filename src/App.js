import React from 'react';
import PubNub from 'pubnub';
import { PubNubProvider, usePubNub } from 'pubnub-react';
import { useState, useEffect } from 'react';


function makeid(length) { // Used to create new user ids 
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const pubnub = new PubNub({
  publishKey: 'pub-c-dc6b6d35-b1b6-45c4-8a0a-5ce8cd792219',
  subscribeKey: 'sub-c-727207b9-420e-4e21-b1ff-ff57ea44f2df',
  uuid:  'Anon-' + makeid(5)
});

const channel = 'awesome-channel';

function Chat() {
  const pubnub = usePubNub();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    pubnub.subscribe({ channels: [channel] });

    pubnub.addListener({
      message: messageEvent => {
        setMessages(messages => [...messages, messageEvent.message]);
      },
    });

    return () => {
      pubnub.unsubscribe({ channels: [channel] });
    };
  }, [pubnub]);

  const handleSubmit = (event) => {
    event.preventDefault();
    pubnub.publish({ channel, message: input });
    setInput('');
  };

  return (
    <div>
      <div style={{height: '300px', overflowY: 'scroll', border: '1px solid black', padding: '10px'}}>
        {messages.map((message, index) => (
          <div key={`message-${index}`}>{message}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <PubNubProvider client={pubnub}>
      <Chat />
    </PubNubProvider>
  );
}

export default App;