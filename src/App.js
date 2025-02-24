import './App.css';
import React, { useEffect, useState } from 'react';
import Calendar from './Calendar';

require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const App = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [columns, setColumns] = useState([
    { name: "Person 1", id: "R1" },
    { name: "Person 2", id: "R2" },
    { name: "Person 3", id: "R3" },
    { name: "Person 4", id: "R4" },
    { name: "Person 5", id: "R5" },
    { name: "Person 6", id: "R6" },
    { name: "Person 7", id: "R7" },
  ]);

  // Load gapi client and GIS
  useEffect(() => {
    const loadGapi = () => {
      window.gapi.load('client', initializeGapiClient);
    };

    const loadGis = () => {
      const tokenClientInstance = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => handleAuthResponse(resp),
      });
      setTokenClient(tokenClientInstance);
      setGisInited(true);
    };

    // Load Google API scripts
    const scriptGapi = document.createElement('script');
    scriptGapi.src = "https://apis.google.com/js/api.js";
    scriptGapi.onload = loadGapi;
    scriptGapi.async = true;
    document.body.appendChild(scriptGapi);

    const scriptGis = document.createElement('script');
    scriptGis.src = "https://accounts.google.com/gsi/client";
    scriptGis.onload = loadGis;
    scriptGis.async = true;
    document.body.appendChild(scriptGis);
  }, []);

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiInited(true);
    maybeEnableButtons();
  };

  const maybeEnableButtons = () => {
    if (gapiInited && gisInited) {
      document.getElementById('authorize_button').style.visibility = 'visible';
    }
  };

  const handleAuthClick = () => {
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      setEvents([]);
      setIsAuthenticated(false);
    }
  };

  const handleAuthResponse = async (resp) => {
    if (resp.error !== undefined) {
      console.error('Authentication error:', resp.error);
      return;
    }
    setIsAuthenticated(true);
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = 'Refresh';
    await listUpcomingEvents();
  };

  const listUpcomingEvents = async () => {
    let response;
    try {

      const timeMin = new Date().toISOString();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 1); // timespan of requested events is 24 hrs
      const timeMaxISOString = timeMax.toISOString();

      const request = {
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMaxISOString,
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      };
      response = await window.gapi.client.calendar.events.list(request);
    } catch (err) {
      console.error('Error fetching events:', err);
      return;
    }

    const eventsList = response.result.items;
    if (!eventsList || eventsList.length === 0) {
      setEvents(['No events found.']);
      return;
    }

    // map requested Google Calendar events to daypilot format
    const mappedEvents = eventsList.map((event) => {
      const startDateTime = event.start.dateTime || event.start.date;
      const endDateTime = event.end.dateTime || event.end.date;
    
      const formattedStartDateTime = startDateTime.slice(0, 19); // remove timezone offset
      const formattedEndDateTime = endDateTime.slice(0, 19);
      console.log("Event Start DateTime:", formattedStartDateTime);
      console.log("Event End DateTime:", formattedEndDateTime);
    
      return {
        id: event.id,
        text: event.summary,
        start: formattedStartDateTime,
        end: formattedEndDateTime,
        resource: "R1",
        barColor: "#00aaff",
      };
    });    

    setEvents(mappedEvents);
  };

  return (
    <div className="app-container">
      <header>
        <h1 className='home-title'>TimeWise</h1>
        <p>TimeWise is an advanced scheduling platform designed to simplify the process of coordinating meetings across multiple time zones.</p>
      </header>
      {/* <h1>Google Calendar API Quickstart</h1> */}
      <button
        id="authorize_button"
        onClick={handleAuthClick}
        style={{ visibility: gapiInited && gisInited ? 'visible' : 'hidden' }}
      >
        Connect Google Calendar
      </button>
      <button
        id="signout_button"
        onClick={handleSignoutClick}
        style={{ visibility: isAuthenticated ? 'visible' : 'hidden' }}
      >
        Sign Out
      </button>
      {/* <pre id="content" style={{ whiteSpace: 'pre-wrap' }}>
        {events.join('\n')}
      </pre> */}

      <div className="calendar-container">
          <div className="calendar-wrapper">
          <Calendar events={events} columns={columns} />
        </div>
      </div>

    </div>
  );
};

export default App;
