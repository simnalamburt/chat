Chat [![Build Status]][Travis CI]
========
Simple web-based chat app.

![Sample Image](sample.png)
```bash
# Building client-side codes
cd client

yarn install  # Install dependencies
yarn build    # Build

# TODO: 프로덕션 빌드와 개발빌드 구분하기
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

--------

MIT License

[Build Status]: https://travis-ci.org/simnalamburt/chat.svg?branch=master
[Travis CI]: https://travis-ci.org/simnalamburt/chat
