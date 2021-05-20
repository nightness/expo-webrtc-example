# expo-webrtc-example
WebRTC support for Expo using WebView's? (Experimental)

### __Motivation behind__
Getting WebRTC to Expo without ejecting out of Expo

### __Status___
The Expo web platform works... I'm working on getting Expo Go to support it (if possible). Native builds are untested.

### __Note about WebRTC.html__
This is the static file the WebView should load. It also contains my config but I'm not going to host a dirty signaling server. Use your own config please, mine is write protected anyways. I'll eventually be implementing all Firestore writes (create call, join call, and hang up) as cloud functions.

### __Credit for WebRTC.html__
I've modifed it a bit, but it's from Jeff Delaney demo.

Demo: https://github.com/fireship-io/webrtc-firebase-demo

Video: https://www.youtube.com/watch?v=WmR9IMUD_CY
