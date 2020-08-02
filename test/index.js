/* eslint-disable import/extensions */
/* eslint-disable prettier/prettier */
/* eslint-disable no-restricted-syntax */

import Client from 'https://unpkg.com/@synapsejs/synapse@1.0.5/build/lib.browser/Client.js';

let api = null;

const render = (messages) => {
  for (const msg of messages) {
    document.getElementById('messages').innerHTML += `
      <div><b>${msg.id}:</b> ${msg.text}</div>
    `;
  }
};

Client.connect('ws://localhost:3000/api').then(async (client) => {
  api = client;

  api.get('/comment/page/1').then((res) => render(res.payload));
  api.subscribe('/comment/last', {}, (message) => render([message]));
});

window.post = () => {
  api.post('/comment', { text: document.getElementById('text').value });
};