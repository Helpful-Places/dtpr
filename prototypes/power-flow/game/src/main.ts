import { Client } from 'boardgame.io/client';
import { PowerFlow } from './game';
import { mount } from './ui/render';
import './ui/styles.css';

const client = Client({
  game: PowerFlow,
  numPlayers: 2,
  debug: import.meta.env.DEV,
});
client.start();

mount(document.getElementById('app')!, client);
