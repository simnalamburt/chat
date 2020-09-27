Chat [![Build Status]][Travis CI]
========
Simple web-based chat app.

![Sample Image]

```bash
cd client

# Install client-side dependencies
yarn
# Build client-side codes
yarn build
yarn build:dev

yarn prettier
yarn prettier:fix
```
```bash
cd server

# Install server-side dependencies
bundle

# Start a server, See http://localhost:4567
bundle exec run

# Start the server in production mode
RACK_ENV=production bundle exec run
```

--------

MIT License

[Build Status]: https://travis-ci.org/simnalamburt/chat.svg?branch=master
[Travis CI]: https://travis-ci.org/simnalamburt/chat
[Sample Image]: https://raw.githubusercontent.com/simnalamburt/i/master/chat/sample.png
