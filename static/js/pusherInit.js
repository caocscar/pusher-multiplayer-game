// open a connections to Channels
let pusher = new Pusher('9d5365f81a0e2a336b50', {
  authEndpoint: '/pusher/auth',
  cluster: 'us2',
});
let url = new URL(window.location.href);
let name = url.searchParams.get("username");

// subscribe to the my-channel channel
let channel = pusher.subscribe(`private-${name}`)
channel.bind('pusher:subscription_succeeded', function() {
  console.log('subscription registered with PRIVATE channel')
});
// bind a function to event name
channel.bind('client-updateValue', data => {
  d3.select('#value2').text(numFormat(data.value))
  slider2.silentValue(data.value)
});
// bind a function for messages
channel.bind('client-messages', data => {
  d3.select('#msg').text(data)
})
// bind a function for starting the game on ask side
channel.bind('client-game-started', () => playGame() )

let pl = d3.select('#playerlist')

// page initialization
let players = 0
let connectedPlayers = []
let presenceChannel = pusher.subscribe('presence-channel');
presenceChannel.bind('pusher:subscription_succeeded', members => {
  console.log('subscription registered with PRESENCE channel')
  players = members.count
  members.each(member => { if (member.id != name) { connectedPlayers.push(member.id) } });
  updatePlayers()
});

// when someone joins the presence channel
presenceChannel.bind('pusher:member_added', member => {
  console.log('member added')
  players = presenceChannel.members.count;
  connectedPlayers.push(member.id)
  updatePlayers()
});

// when someone leaves the presence channel
presenceChannel.bind('pusher:member_removed', member => {
  console.log('member removed')
  players = presenceChannel.members.count;
  let idx = connectedPlayers.indexOf(member.id);
  idx > -1 ? connectedPlayers.splice(idx,1) : null
  updatePlayers()
});

// update list items
function updatePlayers() {
  pl.selectAll('li')
    .data(connectedPlayers)
    .join('li')
      .attr('class', 'player')
      .text(d => d)
      .on('click', d => choosePlayer(d))
}

// initiatate game with someone
function choosePlayer(opponent) {
  oppChannel = pusher.subscribe(`private-${opponent}`)
  oppChannel.bind('pusher:subscription_succeeded', () => {
    oppChannel.trigger(`client-${opponent}`, name) // send message
    d3.select('#msg').text(`Asking for game with ${opponent}`)
    console.log(`Asking for game with ${opponent}`)
  })
}

// listen on all channels for asking a game w/ someone
pusher.bind(`client-${name}`, opponent => {
  oppChannel = pusher.subscribe(`private-${opponent}`)
  oppChannel.bind('pusher:subscription_succeeded', () => {
    if (confirm(`Do you want to start a game with ${opponent}`)) {
      oppChannel.trigger('client-game-started', opponent)
      d3.select('#msg').text(`Game started with ${opponent}`)
      oppChannel.trigger('client-messages', `Game started with ${name}`)
      playGame()  // start game on accept side
      console.log(`Start game with ${opponent}`)
    } else {
      oppChannel.trigger('client-game-declined', "")
      d3.select('#msg').text(`Game declined with ${opponent}`)
      oppChannel.trigger('client-messages', `Game declined with ${opponent}`)
      console.log(`Declined game with ${opponent}`)
    }
  })
})