'use strict'

//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');

const app = express();
app.use(cors());

//postgres client
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));



const PORT = process.env.PORT;

//Constructors

//location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}
//weather
function Day (summary, time) {
  this.forecast = summary;
  this.time = new Date(time *1000).toDateString();
}
//

// =========== TARGET LOCATION from API ===========

app.get('/location', (request, response) => {
  const searchQuery = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet.

  client.query(`SELECT * FROM locations WHERE search_query=$1`, [searchQuery]).then(sqlResult => {

    //if stuff:
    if(sqlResult.rowCount >0){
      console.log('Found data in database')
      response.send(sqlResult.rows[0]);
    } else {

      console.log('nothing found in database, asking google')
      const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;
      
      superagent.get(urlToVisit).then(responseFromSuper => {

        const geoData = responseFromSuper.body;
        const specificGeoData = geoData.results[0];
        
        const formatted = specificGeoData.formatted_address;
        const lat = specificGeoData.geometry.location.lat;
        const lng = specificGeoData.geometry.location.lng;
        
        const newLocation = new Location(searchQuery, formatted, lat, lng);
        //start the response cycle
        
        //Within superagent, creating placeholders so we can add information to database
        
        //action(insert) "into" where (values)
        const sqlQueryInsert = `INSERT INTO locations
        (search_query, formatted_query, latitude, longitude)
        VALUES
        ($1, $2, $3, $4)`;

        const valuesArray = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];


        //sqlQueryInsert is the affore mentioned string, which is sql script(instructions)
        //values Array is that array
        //client.query combies the string and array, and per the string's instructions, creates rows, and then fills the rows with the array's contents
        
        client.query(sqlQueryInsert, valuesArray);
        
        response.send(newLocation);

      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })

    }      
  })
})

    
    // =========== TARGET WEATHER from API ===========
    
app.get('/weather', getWeather)
  function getWeather(request, response){
  // console.log(request);

  const localData = request.query.data;
  // console.log(localData);
  
  client.query(`SELECT * FROM weather WHERE search_query=$1`, [localData.search_query]).then(sqlResult => {

  //found stuff in database
    if(sqlResult.rowCount > 0){
      console.log('found weather stuff in databse')
      response.send(sqlResult.rows[0]);
      console.log(sqlResult.rows);

    }else {
      console.log('did not find in database, googling now!');

    const urlDarkSky = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;


    superagent.get(urlDarkSky).then(responseFromSuper => {

      const weatherData = responseFromSuper.body;
      const eightDays = weatherData.daily.data;
      const formattedDays = eightDays.map(day => new Day(day.summary, day.time));

      //forEach for each day
    
      formattedDays.forEach(day => {

        const sqlQueryInsert = `INSERT INTO weather
      (search_query, forecast, time)
      VALUES
      ($1, $2, $3)`;

      const valuesArray = [localData.search_query, day.forecast, day.time];
      client.query(sqlQueryInsert, valuesArray);
      console.log('accessing values array', valuesArray);
    })
      

      response.send(formattedDays)
    }).catch(error => {
      response.status(500).send(error.message);
      console.error(error);
    })
  };

  });
}





// ============ EVENTBRITE from API ==============

app.get('/events', getEvents)

function getEvents(request, response){

  let eventData = request.query.data;

  const urlfromEventbrite = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=${process.env.EVENTBRITE_API_KEY}`;

  superagent.get(urlfromEventbrite).then(responseFromSuper => {
    // console.log(responseFromSuper.body)

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
