'use strict'

//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config()

const app = express();
app.use(cors());

const PORT = process.env.PORT;

//Constructor for Location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

// =========== TARGET LOCATION from API ===========

app.get('/location', (request, response) => {
  const query = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet.

  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  superagent.get(urlToVisit).then(responseFromSuper => {
    console.log('stuff', responseFromSuper.body);


    const geoData = responseFromSuper.body;

    const specificGeoData = geoData.results[0];

    const formatted = specificGeoData.formatted_address;
    const lat = specificGeoData.geometry.location.lat;
    const lng = specificGeoData.geometry.location.lng;

    const newLocation = new Location(query, formatted, lat, lng);
    //start the response cycle
    response.send(newLocation);
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
})

// =========== TARGET WEATHER from API ===========

app.get('/weather', getWeather)

function getWeather(request, response){
  // console.log(request);

  const localData = request.query.data;

  const urlDarkSky = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;

  superagent.get(urlDarkSky).then(responseFromSuper => {

    const weatherData = responseFromSuper.body;
    // console.log('weather', weatherData);

    const eightDays = weatherData.daily.data;

    const formattedDays = eightDays.map(day => new Day(day.summary, day.time)
    );
    response.send(formattedDays)
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
  function Day (summary, time) {
    this.forecast = summary;
    this.time = new Date(time *1000).toDateString();
  }
}
// ============ EVENTBRITE from API ==============

app.get('/events', getEvents)

function getEvents(request, response){

  let eventData = request.query.data;

  const urlfromEventbrite = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=${process.env.EVENTBRITE_API_KEY}`;

  superagent.get(urlfromEventbrite).then(responseFromSuper => {
    console.log(responseFromSuper.body)

    const eventbriteData = responseFromSuper.body.events;

    const formattedEvents = eventbriteData.map(event => new Event(event.url, event.name.text, event.start.local, event.description.text));

    response.send(formattedEvents);
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
  function Event (link, name, event_date, summary){
    this.link = link;
    this.name = name;
    this.event_date = new Date(event_date).toDateString();
    this.summary = summary;
  }
}

// ====================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});


// class notes

// API is a server that lives on the internet. Places where code lives.
//1. Go to google api console developer website.
// 2. Copy URL in Postman and in server.js under /location
// 3. install superagent = require('superagent') ---> NOT EXPRESS (recieves http request, ears of operation). SUPERAGENT is the mouth, it talks to the internet over http.
// 4. rnpm install -S superagent
//5. superagent.get('url from string')
//......
//10. The dynamic part of the code is in the addess.


//lab tomorrow
//1. Get location (just did in class) and weather and eventbite data from the internet.
//2. Trello board has everything I need for days instructions.
