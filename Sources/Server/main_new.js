// WIFI PW is chimchim
const raspi = require("raspi");
const gpio = require("raspi-gpio");
var http = require('http');
var url = require('url');
var events = require('events');
var eventEmitter = new events.EventEmitter();


var CONFIG  =  {
    RELEASE: {
            pin: new gpio.DigitalInput({ pin: "GPIO6", pullResistor: gpio.PULL_DOWN }),
            lastvalue: 0,
            human_name: "Release Mechanism",
            startTime: '',
            events: new events.EventEmitter()
    },
    TRACKS: [
        {
            id: 1,
            pin: new gpio.DigitalInput({ pin: "GPIO13", pullResistor: gpio.PULL_DOWN }),
            lastvalue: 0,
            human_name: "Track 1",
            endTime: '',
            computedTimeSeconds: '',
            events: new events.EventEmitter()
        },
        {
            id: 2,
            pin: new gpio.DigitalInput({ pin: "GPIO19", pullResistor: gpio.PULL_DOWN }),
            lastvalue: 0,
            human_name: "Track 2",
            endTime: '',
            computedTimeSeconds: '',
            events: new events.EventEmitter()
        },
        /*{
            id: 3,
            pin: "GPIO26",
            adcchannel: 2,
            events: new EventEmitter(),
            human_name: "Track 3",
	          endTime: '',
            computedTimeSeconds: '',
            ctl: {}
        }*/
    ],
    winner: null,
    HTTP_PORT: 8080
};

raspi.init(() => {

  // Parse configuration, set LED to solid green to indicate that track is ready.
  watchPins();
  console.log("WATCHING PINS");

  // Monitor events from track release mechanism
  CONFIG.RELEASE.events.on("HIGH", function() {
    // Only record start time if no start time has yet been written.
    if(CONFIG.RELEASE.startTime === ""){ // Never overwrite existing start times
      CONFIG.RELEASE.startTime = Date.now(); // Record time
    }
  });
  
  
  for(var i = 0; i < CONFIG.TRACKS.length; i++) {
		/*
		*	Handle Track Button Down
		*/
		(function() {
			var track = CONFIG.TRACKS[i];		
		  var index = i;	
		
		  track.events.on("HIGH", function() {
				console.log("Track Finished "+index+1);
				trackFinished(index);
		  });
    })();
		
  }
});

http.createServer(function(req, res) {

    if (req.method === "GET") {

        var call = url.parse(req.url, true);

        // allow any origin to make API calls.
        res.setHeader('Access-Control-Allow-Origin', '*');

        processRequest(call.pathname, req, res);

    } else {
        res.writeHead(400);
        res.end(JSON.stringify({
            error: "method not implemented"
        }));
    }

}.bind({
    CONFIG: CONFIG
})).listen(CONFIG.HTTP_PORT);

function trackFinished(index) {
	if(CONFIG.TRACKS[index].endTime === ""){
    CONFIG.TRACKS[index].endTime = Date.now();
    CONFIG.TRACKS[index].computedTimeSeconds = computeElapsedTime(CONFIG.RELEASE.startTime, CONFIG.TRACKS[index].endTime);
  }
  
  var trackTime = CONFIG.TRACKS[index].computedTimeSeconds;
  var winner = true; 
  for(var i = 0; i < CONFIG.TRACKS.length; i++) {
	  if(winner >= CONFIG.TRACKS[i].computedTimeSeconds) {
		  winner = false;
	  }
  }
  
  if(winner) {
	  CONFIG.winner = index;
  }
}

function processRequest(method, req, res) {

    switch (method) {
        case "/get/state": // Retrieve track/application state
            res.writeHead(200);
            res.end(JSON.stringify(getState()));
            break;

        case "/set/reset": // Soft reset button (in addition to physical one)
            res.writeHead(200);
            res.end(JSON.stringify({
                command_sent: true
            }));
            resetState();
            break;

        default: // Unhandled API method
            res.writeHead(400);
            res.end(JSON.stringify({
                error: "method not implemented"
            }));
    }

}

// Parses configuration and instantiates all relevant track components
function watchPins() {
  setInterval(function() {	  
	  CONFIG.RELEASE.lastvalue = monitorPin(CONFIG.RELEASE.pin, CONFIG.RELEASE.lastvalue, CONFIG.RELEASE.events);
	  
	  for(var i = 0; i < CONFIG.TRACKS.length; i++) {
		  CONFIG.TRACKS[i].lastvalue = monitorPin(CONFIG.TRACKS[i].pin, CONFIG.TRACKS[i].lastvalue, CONFIG.TRACKS[i].events);
	  }
  }, 15);
}

function monitorPin(pin, lastvalue, events) {
	var value = pin.read();
	//console.log(value, lastvalue);
	if(value != lastvalue) {
		if(value) {
			//console.log("HIGH");
			events.emit("HIGH");
		} else {
			//console.log("LOW");
			events.emit("LOW");
		}
  }
  
  return value;
}

function getState() {
	var data = {
		RELEASE: {},
		TRACKS: [],
	};
	
	data.RELEASE.human_name = CONFIG.RELEASE.human_name;
	data.RELEASE.startTime = CONFIG.RELEASE.startTime;
	data.RELEASE.lastvalue = CONFIG.RELEASE.lastvalue;
	
	for(var i = 0; i < CONFIG.TRACKS.length; i++) {
		data.TRACKS[i] = {};
		data.TRACKS[i].human_name = CONFIG.TRACKS[i].human_name;
		data.TRACKS[i].endTime = CONFIG.TRACKS[i].endTime;
		data.TRACKS[i].lastvalue = CONFIG.TRACKS[i].lastvalue;
		data.TRACKS[i].computedTimeSeconds = CONFIG.TRACKS[i].computedTimeSeconds;
	}
	
	return data;
}

// Reset all recorded and computed times, for all tracks
function resetState(){
  CONFIG.RELEASE.startTime = '';
  for (var i = 0; i < CONFIG.TRACKS.length; i++) {
    CONFIG.TRACKS[i].endTime = '';
    CONFIG.TRACKS[i].computedTimeSeconds = '';
  }
}

// @params startTime - initial time at which car was released
// @params endTime - time at which car reached the end of the track
function computeElapsedTime(startTime, endTime){
  return ((endTime-startTime)/1000);
}

// Blink LED indicator rapidly (every 100ms) on uncaught exceptions.
process.on('uncaughtException', function(e) {
  console.log(e);
});
