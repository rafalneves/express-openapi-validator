const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const http = require('http');
const OpenApiValidator = require('../../src').OpenApiValidator;
const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const spec = path.join(__dirname, 'openapi.yaml');
app.use('/spec', express.static(spec));

// 1. Install the OpenApiValidator on your express app
new OpenApiValidator({
  apiSpec: './test/common/test.yaml',
  // securityHandlers: {
  //   ApiKeyAuth: (req, scopes, schema) => true,
  // },
}).install(app);

// 2. Add routes
app.get('/v1/pets', function(req, res, next) {
  res.json([{ id: 1, name: 'max' }, { id: 2, name: 'mini' }]);
});

app.post('/v1/pets', function(req, res, next) {
  res.json({ name: 'sparky' });
});

app.get('/v1/pets/:id', function(req, res, next) {
  res.json({ id: req.params.id, name: 'sparky' });
});

// 2a. Add a route upload file(s)
app.post('/v1/pets/:id/photos', function(req, res, next) {
  // DO something with the file
  // files are found in req.files
  // non file multipar params are in req.body['my-param']
  console.log(req.files);

  res.json({
    files_metadata: req.files.map(f => ({
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      // Buffer of file conents
      // buffer: f.buffer,
    })),
  });
});

// 3. Create a custom error handler
app.use((err, req, res, next) => {
  // format error
  console.error(err, err.stack);
  if (!err.status && !err.errors) {
    res.status(500).json({
      errors: [
        {
          message: err.message,
        },
      ],
    });
  } else {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  }
});

const server = http.createServer(app);
server.listen(3000);
console.log('Listening on port 3000');

module.exports = app;
