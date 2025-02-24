// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <h1>TimeWise</h1>
//     </div>
//   );
// }

// export default App;


import React, { useEffect, useState } from 'react';
import Calendar from './Calendar';

const CLIENT_ID = '468806073766-tum5giri2u34o2nl5bgi7tdbbsd1eanb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDAaWDe9otmbPV7JbrpDw-ZYscnan1pToA';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const App = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);

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

      const timeMin = new Date().toISOString(); // Current time
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 1); // 1 day from today
      const timeMaxISOString = timeMax.toISOString(); // Convert to ISO string


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

    const output = eventsList.map((event) => `${event.summary} (${event.start.dateTime || event.start.date})`).join('\n');
    setEvents(output.split('\n'));
  };

  return (
    <div>
      <h1 className='home-title'>TimeWise</h1>
      <p>TimeWise is an advanced scheduling platform designed to simplify the process of coordinating meetings across multiple time zones.</p>
      {/* <h1>Google Calendar API Quickstart</h1> */}
      <button
        id="authorize_button"
        onClick={handleAuthClick}
        style={{ visibility: gapiInited && gisInited ? 'visible' : 'hidden' }}
      >
        Authorize
      </button>
      <button
        id="signout_button"
        onClick={handleSignoutClick}
        style={{ visibility: isAuthenticated ? 'visible' : 'hidden' }}
      >
        Sign Out
      </button>
      <pre id="content" style={{ whiteSpace: 'pre-wrap' }}>
        {events.join('\n')}
      </pre>

      <Calendar />  {/* This will display your calendar */}

    </div>
  );
};

export default App;
