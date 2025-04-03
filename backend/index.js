const express = require("express");
const routes = require("./routes");
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('', routes);

module.exports = app;