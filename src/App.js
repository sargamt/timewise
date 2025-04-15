import './App.css';
import axios from "axios";
import React, { useEffect, useState, useRef  } from 'react';
import Calendar from './Calendar';

//require('dotenv').config();

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const App = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState([]);
  const [filterCalendarID, setFilterCalendarID] = useState('');
  const [selectedCalendarID, setSelectedCalendarID] = useState('');
  const calendarIDRef = useRef('');
  const [selectedDate, setSelectedDate] = useState('');



  const [dbEvents, setDbEvents] = useState([]); // State to store events fetched from the DB

  const [columns, setColumns] = useState([
    { name: "Person 1", id: "R1" },
    { name: "Person 2", id: "R2" },
    { name: "Person 3", id: "R3" },
    { name: "Person 4", id: "R4" },
    { name: "Person 5", id: "R5" },
    { name: "Person 6", id: "R6" },
    { name: "Person 7", id: "R7" },
  ]);

  const fetchEventsByCalendarID = async () => {
    console.log("Starting fetchEventsByCalendarID with calendar ID:", filterCalendarID);
  
    if (!filterCalendarID.trim()) {
      alert("Please enter a Calendar ID.");
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:5000/api/events?calendarID=${filterCalendarID.trim()}`);
      console.log("Filtered DB events response:", response.data);
  
      const data = response.data.data;
  
      if (!data || !Array.isArray(data)) {
        console.error("Invalid response format for filtered events:", data);
        alert("Invalid data received from server.");
        return;
      }
  
      const mappedEvents = data.map((event, index) => ({
        id: event.id,
        text: "",
        person: event.person || 1,
        start: event.start,
        end: event.end,
        resource: `R${event.person || 1}`,
        barColor: event.barColor || "#00aaff",
        calendarID: calendarIDRef.current || "Unknown",
      }));
  
      setEvents(mappedEvents);
      console.log(`Loaded ${mappedEvents.length} filtered events from DB.`);
    } catch (error) {
      console.error("Error fetching filtered events:", error);
      alert("Failed to fetch events by Calendar ID.");
    }
  };
  

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
    // if (!selectedCalendarID.trim()) {
    //   alert("Please enter a calendar ID before connecting.");
    //   return;
    // }
    
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
  const [nextPersonNumber, setNextPersonNumber] = useState(1);

  // Fetch next available person number when component mounts
  useEffect(() => {
    fetchNextAvailablePersonNumber();
  }, []);
  
  // Function to get next available person number
  const fetchNextAvailablePersonNumber = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/counter/person");
      setNextPersonNumber(response.data.value);
      console.log("Next available person number:", response.data.value);
    } catch (error) {
      console.error("Error fetching next person number:", error);
      setNextPersonNumber(1);
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
    
    // Fetch next available person number before listing events
    await fetchNextAvailablePersonNumber();
    await listUpcomingEvents();
  };

  const listUpcomingEvents = async () => {
    let response;
    try {
      // Log at the beginning of function
      console.log("Starting listUpcomingEvents...");
      
      // Get current person number
      const counterResponse = await axios.get("http://localhost:5000/api/counter/person");
      const currentPersonNumber = counterResponse.data.value;
      console.log("Current person number:", currentPersonNumber);

      const timeMin = new Date().toISOString();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 1);
      const timeMaxISOString = timeMax.toISOString();
      
      console.log("Fetching events between:", timeMin, "and", timeMaxISOString);

      const request = {
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMaxISOString,
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      };
      
      console.log("Sending request to Google Calendar API...");
      response = await window.gapi.client.calendar.events.list(request);
      console.log("Raw Google Calendar response:", response);

      const eventsList = response.result.items;
      console.log("Raw events from Google Calendar:", eventsList);
      
      if (!eventsList || eventsList.length === 0) {
        console.log("No events found in Google Calendar for the specified time range.");
        setEvents(['No events found.']);
        return;
      }

      // Log that we have events
      console.log(`Found ${eventsList.length} events in Google Calendar`);
      const pp = (selectedCalendarID)
      console.log("pp", pp)
      // Use the current person number
      const resourceId = `R${currentPersonNumber}`;
      
      const mappedEvents = eventsList.map((event, index) => {
        const startDateTime = event.start.dateTime || event.start.date;
        const endDateTime = event.end.dateTime || event.end.date;
      
        const formattedStartDateTime = startDateTime.slice(0, 19);
        const formattedEndDateTime = endDateTime.slice(0, 19);


        console.log(`Processing event ${index + 1}:`, { 
          id: event.id,
          summary: event.summary,
          start: formattedStartDateTime,
          end: formattedEndDateTime 
        });
        console.log("Selected calendar ID used for mapping events:", selectedCalendarID);
        return {
          id: event.id,
          text: "",
          start: formattedStartDateTime,
          end: formattedEndDateTime,
          resource: resourceId,
          person: currentPersonNumber,
          barColor: "#4285F4",
          calendarID: calendarIDRef.current
        };
      });    

      console.log("Mapped events for calendar:", mappedEvents);
      
      // Set events to the state before sending to DB
      setEvents(mappedEvents);
      console.log("Events state updated");
      
      // Send events to DB
      await sendEventsToDB(mappedEvents, currentPersonNumber, resourceId);

    } catch (err) {
      console.error('Error in listUpcomingEvents:', err);
      // Check for specific errors
      if (err.result && err.result.error) {
        console.error('Google API error details:', err.result.error);
      }
      return;
    }
  };
  
  // Modify the sendEventsToDB function to handle potential issues
  const sendEventsToDB = async (eventsToSend, personNumber, resourceId) => {
    console.log("Starting sendEventsToDB...");
    
    if (!eventsToSend || eventsToSend.length === 0 || eventsToSend[0] === 'No events found.') {
      console.log("No events available to send to DB.");
      return;
    }
    
    console.log(`Preparing to send ${eventsToSend.length} events with person number:`, personNumber);
    
    try {
      // Create unique IDs for each event to avoid conflicts
      const formattedEvents = eventsToSend.map((event, index) => {
        // Create a more unique ID to avoid conflicts
        const uniqueId = `${event.id}_p${personNumber}_${new Date().getTime()}`;
        
        const formattedEvent = {
          id: uniqueId,
          text: "",
          person: personNumber,
          start: event.start,
          end: event.end,
          resource: `R${personNumber}`,
          barColor: event.barColor || "#4285F4",
          calendarID: calendarIDRef.current
        };
        
        console.log(`Formatted event ${index + 1}:`, formattedEvent);
        return formattedEvent;
      });
      
      console.log("Sending API request to save events...");
      
      // Send events in smaller batches to avoid potential issues
      const batchSize = 10;
      for (let i = 0; i < formattedEvents.length; i += batchSize) {
        const batch = formattedEvents.slice(i, i + batchSize);
        console.log(`Sending batch ${i/batchSize + 1} with ${batch.length} events`);
        
        try {
          const response = await axios.post("http://localhost:5000/api/events", { events: batch });
          console.log(`Batch ${i/batchSize + 1} response:`, response.data);
        } catch (batchError) {
          console.error(`Error with batch ${i/batchSize + 1}:`, batchError);
        }
      }
      
      // increment counter
      console.log("Incrementing person counter...");
      const counterResponse = await axios.post("http://localhost:5000/api/counter/increment");
      const newCounterValue = counterResponse.data.value;
      console.log("Counter incremented to:", newCounterValue);
      
      // update local state
      setNextPersonNumber(newCounterValue);
      console.log("Next person number updated to:", newCounterValue);
      
      // fetch events back from database to verify they were saved
      console.log("Fetching events from database to verify save...");
      await fetchEventsFromDB();
      
    } catch (error) {
      console.error("Error adding events to DB:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      alert("There was an error saving events. See console for details.");
    }
  };
  
  // Modify fetchEventsFromDB to add more debugging
  const fetchEventsFromDB = async () => {
    console.log("Starting fetchEventsFromDB...");
    
    try {
      console.log("Sending request to get events from DB...");
      const response = await axios.get("http://localhost:5000/api/events");
      console.log("Raw response from DB:", response.data);
      
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.error("Invalid response format from server:", response.data);
        alert("Received invalid data format from server");
        return;
      }
      
      const dbEvents = response.data.data;
      console.log(`Received ${dbEvents.length} events from DB`);
      
      if (dbEvents.length === 0) {
        console.warn("No events found in database!");
        alert("No events found in the database");
        return;
      }

      const mappedEvents = dbEvents.map((event, index) => {
        const personNumber = event.person || 1;
        const resourceId = `R${personNumber}`;
        
        const mappedEvent = {
          id: event.id,
          text: "",
          person: personNumber,
          start: event.start,
          end: event.end,
          resource: resourceId,
          barColor: event.barColor || "#00aaff",
          calendarID: event.calendarID || "Q2WVyy"
        };
        
        if (index < 5) { // Log only first 5 events to not have console spam
          console.log(`Mapped DB event ${index + 1}:`, mappedEvent);
        }
        return mappedEvent;
      });

      console.log("Setting events state with mapped DB events");
      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching events from DB:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      alert("Failed to fetch events from database.");
    }
  };

  
  return (
    <div className="app-container">
      <header>
        <h1 className='home-title'>TimeWise</h1>
        <p>TimeWise is an advanced scheduling platform designed to simplify the process of coordinating meetings across multiple time zones.</p>
      </header>

      <div style={{ marginBottom: "10px" }}>

      <div style={{ marginBottom: "10px" }}>
  <label style={{ marginRight: "10px" }}>Select Date:</label>
  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
    style={{
      padding: "8px",
      width: "200px",
      borderRadius: "4px",
      border: "1px solid #ccc"
    }}
  />
</div>
  <input
    type="text"
    placeholder="Enter Calendar ID to add events to"
    value={selectedCalendarID}
    onChange={(e) => {
      setSelectedCalendarID(e.target.value);
      calendarIDRef.current = e.target.value;
    }}
    style={{
      padding: "8px",
      width: "300px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      marginRight: "10px"
    }}
  />
</div>


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
      <button
        onClick={fetchEventsFromDB}
        style={{
          padding: "10px 20px",
          backgroundColor: "#00aaff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        View Events from DB
      </button>


      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter Calendar ID"
          value={filterCalendarID}
          onChange={(e) => setFilterCalendarID(e.target.value)}
          style={{
            padding: "8px",
            marginRight: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc"
          }}
        />
        <button
          onClick={fetchEventsByCalendarID}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Fetch by Calendar ID
        </button>
      </div>

  
      <div className="calendar-container">
        <div className="calendar-wrapper">
          <Calendar events={events} columns={columns} />
        </div>
      </div>

    </div>
  );
};

export default App;
