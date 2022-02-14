const http = require('http');
const fs = require('fs');
const url = require('url');

const staticFiles = new Set(['/', '/control-sl.html']);

var state = {
  started: false,
};

function resetState() {
  state = {
    started: false,
  };
}

function sendFile(url, response) {
  const filePath = url == '/' ? '/index.html' : url;
  const extension = filePath.split('.', 2)[1];
  const contentType = {
    'css': 'text/css',
    'html': 'text/html',
    'js': 'application/javascript',
    'json': 'application/json',
  }[extension] || 'text/html';
  fs.readFile('static' + filePath, (err, content) => {
    response.writeHead(200, {'Content-Type': contentType});
    response.end(content, 'utf-8');
  });
}

async function handlePage(request, response) {
  const req = url.parse(request.url, true);
  if (staticFiles.has(request.url)) {
    sendFile(request.url, response);
  } else if (req.pathname == '/get-timer') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    if (state.started && state.end > Date.now()) {
      response.end(JSON.stringify({
        started: true,
        remainingDuration: state.end - Date.now(),
        originalDuration: state.duration,
      }));
    } else {
      response.end(JSON.stringify({started: false}));
    }
  } else if (req.pathname == '/start-timer-sl') {
    const durationMs = parseInt(req.query.durationMs, 10);
    state = {
      started: true,
      end: Date.now() + durationMs,
      duration: durationMs,
    };
    response.writeHead(200, {'Content-Type': 'text'});
    response.end('ok');
  } else {
    response.writeHead(404, 'not found');
    response.end();
  }
}

function main() {
  const port = process.env.PORT || 8000;
  http.createServer(handlePage).listen(port, error => {
    console.log('started on http://localhost:' + port + '/');
    console.log('errors: ', error || 'none');
  });
}

main();
