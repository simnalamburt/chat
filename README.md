Chat [![Build Status]][CI]
========

Simple web-based chat app. Please visit https://chat.hyeon.me/#7J6R64-ZIOyYiOyLnA for the working sample
```bash
# Building client-side codes
cd client

npm install   # Install dependencies
npm test      # Static type checking (flow)
npm run build # Build everything     (flow + webpack)

npm start     # Run webpack in watch mode
```
```bash
# Running server
cd server
bundle        # Install dependencies

./run         # Start a server
              # See http://localhost:4567


# Start the server in production mode
RACK_ENV=production ./run
```

[Build Status]: https://travis-ci.org/simnalamburt/chat.svg?branch=master
[CI]: https://travis-ci.org/simnalamburt/chat
