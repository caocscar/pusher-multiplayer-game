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
channel.bind('client-updateValue', function(data) {
  d3.select('#value2').text(numFormat(data.value))
  slider2.silentValue(data.value)
});
// bind a function for messages
channel.bind('client-messages', function(data) {
  d3.select('#msg').text(data)
})
// bind a function for starting the game on ask side
channel.bind('client-game-started', function(tf) {
  if (tf) { playGame() }
})

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
  otherPlayerChannel = pusher.subscribe(`private-${opponent}`)
  otherPlayerChannel.bind('pusher:subscription_succeeded', () => {
    otherPlayerChannel.trigger(`client-${opponent}`, name) // send message
    d3.select('#msg').text(`Asking for game with ${opponent}`)
    console.log(`Asking for game with ${opponent}`)
  })
}

// listener for asking game with someone
pusher.bind(`client-${name}`, opponent => {
  otherPlayerChannel = pusher.subscribe(`private-${opponent}`)
  otherPlayerChannel.bind('pusher:subscription_succeeded', () => {
    if (confirm(`Do you want to start a game with ${opponent}`)) {
      otherPlayerChannel.trigger('client-game-started', opponent)
      d3.select('#msg').text(`Game started with ${opponent}`)
      otherPlayerChannel.trigger('client-messages', `Game started with ${name}`)
      playGame()  // start game on accept side
      console.log(`Start game with ${opponent}`)
    } else {
      otherPlayerChannel.trigger('client-game-declined', "")
      d3.select('#msg').text(`Game declined with ${opponent}`)
      otherPlayerChannel.trigger('client-messages', `Game declined with ${opponent}`)
      console.log(`Declined game with ${opponent}`)
    }
  })
})

// https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
let margin = {top: 20, right: 50, bottom: 20, left: 130},
  width = 500 - margin.left - margin.right,
  height = 200 - margin.top - margin.bottom;

const xoffset = 125,
  symbolSize = 250,
  symbol = d3.symbol().type(d3.symbolCircle).size(symbolSize)(),
  tickValues = [0, 2.5, 5],
  stepSize = 0.1;

// rectangle
let R = d3.select('.container').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'back')
.append("rect")
  .attr('class', 'top')
  .attr("width", 10)
  .attr("height", 90)
  .attr('x', xoffset)
  .attr('y', 15)
  .attr('opacity', 0)

const data = d3.range(6)
const h = 12 // pixels
const numFormat = d3.format('$.2f')
const timeFormat = d3.format('.1f')

// Tale of two sliders
let X = d3.scaleLinear()
  .domain(d3.extent(data))

let slider1 = d3.sliderBottom(X)
  .width(width)
  .tickFormat(numFormat)
  .tickValues(tickValues)
  .step(stepSize)
  .handle(symbol) 
  .default(Math.floor(Math.random()*50)/10)
  .fill('#a1d99b')
  .on('onchange', d => d3.select('#value1').text(numFormat(d)));
  
let slider2 = d3.sliderBottom(X)
  .width(width)
  .tickFormat(numFormat)
  .tickValues(tickValues)
  .step(stepSize)
  .handle(symbol)
  .fill('#31a354')
  .on('onchange', d => d3.select('#value2').text(numFormat(d)));

let P1 = d3.select('.back').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'bottom')
.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`)
  .attr('id', 's1')
  .call(slider1);

let P2 = d3.select('.back').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'bottom')
  .attr('pointer-events', 'none')
.append("g")
  .attr("transform", `translate(${margin.left},${margin.top+height/2})`)
  .attr('id', 's2')
  .attr('opacity', 0)
  .call(slider2);

// team labels
P1.append('text')
  .attr('class', 'player')
  .attr('x', -80)
  .attr('y', 0.33*h)
  .text('You')
P1.append('text')
  .attr('id', 'value1')
  .attr('x', -80)
  .attr('y', 3*h)
  .text(slider1.value())

P2.append('text')
  .attr('class', 'player')
  .attr('x', -80)
  .attr('y', 0.33*h)
  .text('Opponent')
P2.append('text')
  .attr('id', 'value2')
  .attr('x', -80)
  .attr('y', 3*h)
  .text(slider2.value())

d3.selectAll('.track')
  .attr('stroke-width', h)
d3.selectAll('.track-inset')
  .attr('stroke-width', h-2)          
d3.selectAll('.track-fill')
  .attr('stroke-width', h-2)

// check for a match
function playGame() {
  let T = 10000
  let msg
  const t0 = new Date
  let t1 = new Date
  let flag = true
  let history = [[slider1.value(), slider2.value()]]
  let check4Match = setInterval(function() {
    channel.trigger('client-updateValue', {'value': slider1.value()})
    history.push([slider1.value(), slider2.value()])
    console.log(check4Match)
    if (slider1.value() == slider2.value()) {
        msg = 'PEEK-A-BOO'
        d3.select('.top').attr('opacity', 0.5)
        x2 = parseInt(d3.select('.track-fill').attr('x2'))
        d3.select('.top').attr('x', xoffset+x2)
        d3.selectAll('.parameter-value path').attr('fill', '#2719C7')
    } else {
        msg = 'NO MATCHES'
        d3.select('.top').attr('opacity', 0)
        d3.selectAll('.parameter-value path').attr('fill', 'white')
    }
    t1 = new Date
    d3.select('h2').text(`${msg} (${timeFormat((t1-t0)/1000)}s)`)
    if (t1-t0 >= T) {
        clearInterval(check4Match)
        check4Match = 0
        d3.select('.bottom').attr('pointer-events', 'none') // disable slider
    }
    if (flag & t1-t0 >= 2500) {
        d3.select('#s2').attr('opacity', 1)
        flag = !flag
    }
  }, 200); // rate limit of 10 Hz (=== lower limit of 100)

  // Set marker to last spot if mouse is held down after game is over
  let postGame = setInterval(function() {
    if (t1-t0 >= T) {
        lastValue = history.slice(-1)[0]
        slider1.silentValue(lastValue[0])
        d3.select('#value1').text(numFormat(lastValue[0]))
    }
  }, 1010)

}

