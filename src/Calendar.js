import React, { useState, useEffect } from 'react';
import {DayPilotCalendar, DayPilot} from "@daypilot/daypilot-lite-react";
// import { DayPilotCalendar } from "@daypilot/daypilot-lite-react";
const Calendar = () => {
    // State for viewType
    const [config, setConfig] = useState({
      viewType: "Resources",
    });
  
    // State for startDate
    const [startDate, setStartDate] = useState(DayPilot.Date.today());
  
    // State for columns
    const [columns, setColumns] = useState([]);
  
    // State for calendar events/reservations
    const [events, setEvents] = useState([]);
  
    // useEffect to initialize columns
    useEffect(() => {
      setColumns([
        { name: "Room 1", id: "R1" },
        { name: "Room 2", id: "R2" },
        { name: "Room 3", id: "R3" },
        { name: "Room 4", id: "R4" },
        { name: "Room 5", id: "R5" },
        { name: "Room 6", id: "R6" },
        { name: "Room 7", id: "R7" },
      ]);
  
      setEvents([
        {
          id: 1,
          text: "Event 1",
          start: "2025-02-23T11:00:00",
          end: "2025-02-23T13:30:00",
          barColor: "#fcb711",
          resource: "R1"
        },
        {
          id: 2,
          text: "Event 2",
          start: "2025-02-23T10:00:00",
          end: "2025-02-23T12:00:00",
          barColor: "#f37021",
          resource: "R2"
        },
        // ...
      ]);
  
    }, []);
  
    return (
      <DayPilotCalendar
        {...config}
        startDate={startDate}
        columns={columns}
        events={events}
      />
    );
  }
  
  export default Calendar;

