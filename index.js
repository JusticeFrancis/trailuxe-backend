require('dotenv').config();
const express = require('express');
const Airtable = require('airtable');
const cors = require('cors')

const app = express();
const port = process.env.PORT || 7000;


app.use(cors())
// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID
);

// Middleware to parse JSON
app.use(express.json());

// Route to get categories with lazy loading (pagination)
app.get('/get-categories', async (req, res) => {
  try {
    const pageSize = 1; // Number of records per page
    const offset = req.query.offset || null; // Pagination offset (default: null)

    const options = {
      pageSize: pageSize, // Fetch only a specific number of records
    };

    // Only add offset if it's not null
    if (offset) {
      options.offset = offset;
    }

    const records = await base('Categories')
    .select()
      .all();

      console.log(records)

    const fields = records.map((record) => record.fields);


    // Return the data and the next offset for pagination
    res.status(200).json({
      data: fields,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route to get products with lazy loading (pagination)
app.get('/get-products', async (req, res) => {
  try {
    const pageSize = 10; // Number of records per page
    const offset = req.query.offset || 0; // Pagination offset (default: 0)

    const records = await base('Products')
      .select()
      .all();

    // Include record_id in the fields object
    const fields = records
    .map((record) => {
      if (record.fields.Name) {
        return {
          ...record.fields, // Spread the existing fields
          record_id: record.id, // Add the record_id
        };
      }
      return null; // Skip records without a Name field
    })
    .filter((record) => record !== null); // Remove null values
    // Return the data and the next offset for pagination
    res.status(200).json({
      data: fields,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req,res)=> {
  return res.json('backend online')
})

// Route to get products with lazy loading (pagination)
app.post('/remove-bg', async (req, res) => {
    try {
      const { imageUrl } = req.body;
  
      // Download the image from the URL
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
  
      // Send the image to Remove.bg API
      const removeBgResponse = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        imageBuffer,
        {
          headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
            'Content-Type': 'application/octet-stream',
          },
          responseType: 'arraybuffer',
        }
      );
  
      // Send the result back to the frontend
      res.set('Content-Type', 'image/png');
      res.send(removeBgResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});