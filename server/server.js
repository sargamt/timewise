const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = {
    origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/api", (req, res) => {
    res.json({ fruits: ["apple", "strawberry", "pineappple"]});
});

app.listen(8001, () => {
    console.log("Server started on port 8001");
});