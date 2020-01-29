// https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
let margin = {top: 20, right: 50, bottom: 20, left: 130},
  width = 500 - margin.left - margin.right,
  height = 200 - margin.top - margin.bottom;

const xoffset = 125,
  symbolSize = 250,
  symbol = d3.symbol().type(d3.symbolCircle).size(symbolSize)(),
  tickValues = [0, 2.5, 5],
  stepSize = 0.1;

// background
let R = d3.select('.container').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'background')
.append("rect") // vertical rectangle
  .attr('class', 'matching')
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

let P1 = d3.select('.background').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'slider')
  .attr('pointer-events', 'none')
.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`)
  .attr('id', 's1')
  .call(slider1);

let P2 = d3.select('.background').append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr('class', 'slider')
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
let msg,
    hideOpp,
    T = 10000,
    history = [[slider1.value(), slider2.value()]]

function resetGame() {
  d3.selectAll('.slider').attr('pointer-events', 'auto') // enable slider
  d3.select('#s2').attr('opacity', 0) // make opponent slider invisible
  d3.select('.matching').attr('opacity', 0) // make matching rectangle invisible
  hideOpp = true // set flag
}

function playGame() {

  resetGame()
  let t0 = new Date
  let t1 = new Date
  let check4Match = setInterval(function() {
    oppChannel.trigger('client-updateValue', {'value': slider1.value()})
    history.push([slider1.value(), slider2.value()])
    if (!hideOpp && slider1.value() == slider2.value()) {
        msg = 'PEEK-A-BOO'
        x2 = parseInt(d3.select('.track-fill').attr('x2'))
        d3.select('.matching').attr('opacity', 0.5)
            .attr('x', xoffset+x2)
        d3.selectAll('.parameter-value path').attr('fill', '#2719C7')
    } else {
        msg = 'NO MATCHES'
        d3.select('.matching').attr('opacity', 0)
        d3.selectAll('.parameter-value path').attr('fill', 'white')
    }
    t1 = new Date
    d3.select('h2').text(`${msg} (${timeFormat((t1-t0)/1000)}s)`)
    if (t1-t0 >= T) {
        clearInterval(check4Match)
        d3.selectAll('.slider').attr('pointer-events', 'none') // disable slider
        oppChannel.trigger('client-messages', `Game FINISHED with ${name}`)
        pusher.unsubscribe(oppChannel.name)
    }
    if (hideOpp && t1-t0 >= 2500) {
        d3.select('#s2').attr('opacity', 1)
        hideOpp = false
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

