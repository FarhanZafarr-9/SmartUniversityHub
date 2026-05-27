const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const testRoute = require('./routes/testRoute');
app.use('/api', testRoute);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');  // Added this to handle the root URL
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🟢 Server running at http://localhost:${PORT}`);
});
