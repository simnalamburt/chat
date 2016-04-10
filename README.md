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

### Note
> 모든 대화에는 퍼머링크가 있어, 이 퍼머링크를 통해 해당 대화를 웹으로 볼 수 있어야 합니다.

위 문장을 '모든 **채널**마다 퍼머링크가 있어야합니다' 라고 해석하고
진행했습니다. 이점 유의부탁드립니다.

[Build Status]: https://travis-ci.org/simnalamburt/chat.svg?branch=master
[CI]: https://travis-ci.org/simnalamburt/chat
