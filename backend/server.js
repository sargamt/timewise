require('dotenv').config();
const express = require('express');
const Event = require('./models/Event'); // Import the model
const mongoose = require('mongoose');
const cors = require('cors');
const Counter = require('./models/Counter');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process with failure
});

// Add a MongoDB connection status check endpoint
app.get('/api/status', (req, res) => {
  const status = {
    server: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(status);
});

// Sample API route
app.get('/api/data', async (req, res) => {
  res.json({ message: "API is working!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/api/events', async (req, res) => {
  try {
    console.log("Received event request body:", JSON.stringify(req.body));
    const events = req.body.events;

    if (!Array.isArray(events) || events.length === 0) {
      console.log("Invalid events data - not an array or empty");
      return res.status(400).json({ message: "Invalid events data" });
    }

    console.log(`Processing ${events.length} events for insertion`);
    
    // Check for required fields before insertion
    const validEvents = events.filter(event => {
      if (!event.id || !event.start || !event.end || !event.resource) {
        console.log("Skipping invalid event:", event);
        return false;
      }
      return true;
    });
    
    console.log(`${validEvents.length} valid events to insert`);
    
    // Log the first event as a sample
    if (validEvents.length > 0) {
      console.log("Sample event:", JSON.stringify(validEvents[0]));
    }

    try {
      // Use a try-catch block specifically for the database operation
      const result = await Event.insertMany(validEvents, { ordered: false });
      console.log(`Successfully inserted ${result.length} events`);
      res.status(200).json({ 
        message: "Events added successfully!", 
        count: result.length,
        data: result 
      });
    } catch (dbError) {
      console.error("Database error during insertion:", dbError);
      
      // Check for duplicate key errors (code 11000)
      if (dbError.code === 11000) {
        console.log("Duplicate key error - events may already exist");
        return res.status(409).json({ 
          message: "Some events already exist in the database", 
          error: dbError.message 
        });
      }
      
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error processing events:', error);
    res.status(500).json({ 
      message: "Failed to add events.", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fetch all events from MongoDB
// Fetch all events or filter by calendarID
app.get('/api/events', async (req, res) => {
  try {
    const { calendarID } = req.query;
    const query = calendarID ? { calendarID } : {};
    const events = await Event.find(query);
    res.status(200).json({ message: "Events fetched successfully", data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: "Failed to fetch events.", error: error.message });
  }
});

app.get('/api/counter/person', async (req, res) => {
  try {
    let counter = await Counter.findOne({ name: 'personCounter' });
    if (!counter) {
      counter = await Counter.create({ name: 'personCounter', value: 1 });
    }
    res.json({ value: counter.value });
  } catch (error) {
    res.status(500).json({ message: "Error getting counter", error: error.message });
  }
});

app.post('/api/counter/increment', async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'personCounter' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    res.json({ value: counter.value });
  } catch (error) {
    res.status(500).json({ message: "Error incrementing counter", error: error.message });
  }
});


