const io = require('./src/io.js');
const _ = require('lodash');

io.attach(3000);

let store = {};

function mergeRoom(room = {}, data = {}) {
  // do not accept changes to the players if cards were generated
  if (data.words && data.cards) {
    delete data.players;
  }

  const result = _.merge({}, room, data);

  if (Array.isArray(data.cards)) {
    result.cards = data.cards;
  }

  return result;
}

io.on('connection', async (socket) => {
  let _room;
  let _sender;

  socket.on('room.join', async ({ room, sender, player }, ack) => {
    _sender = sender;
    _room = room;
    store[room] = store[room] || {};

    await new Promise((resolve) => socket.join(_room, resolve));

    store[room] = mergeRoom(store[room], { players: { [player.id]: player } });

    io.to(_room).emit('room.sync', store[_room]);

    ack({ id: room, data: store[room] });
  });

  socket.on('room.sync', ({ sender, room, data }, ack) => {
    if (!sender || !room || room !== _room) {
      return;
    }

    store[room] = mergeRoom(store[room], data);

    io.to(room).emit('room.sync', store[room]);

    ack({ id: room, data: store[room] });
  });

  socket.on('disconnect', () => {
    if (!_sender || !store[_room] || store[_room].words) {
      return;
    }

    if (store && store[_room] && store[_room].players) {
      delete store[_room].players[_sender];
    }

    io.to(_room).emit('room.sync', store[_room]);
  });
});
