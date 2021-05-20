# expo-webrtc-example
WebRTC support for Expo using WebView's? (Experimental)

### _Idea behind_
Getting WebRTC to Expo without ejecting out of Expo

Expo web works... I'm working on getting Expo Go to support it (if possible).

### _Note about WebRTC.html_
This is the static file the web view should run. It also contains my config but I'm not going to host a dirty signaling server. Use your own config please, mine is write protected anyways. I'll eventually be implementing all Firestore writes (create call, join call, and hang up) as cloud functions.

### _Credit for WebRTC.html_
I've modifed it a bit, but it's from Jeff Delaney demo. https://github.com/fireship-io/webrtc-firebase-demo
