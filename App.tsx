import React, { useEffect, useState } from 'react'
import { AppRegistry, ComponentProvider, Platform, View } from 'react-native'
// @ts-expect-error
import { WebView as WebViewWeb } from 'react-native-web-webview'
import { WebView as WebViewNative, WebViewProps } from 'react-native-webview'
import { WebViewErrorEvent, WebViewNavigationEvent } from 'react-native-webview/lib/WebViewTypes'
// import RNPermissionsModule, { requestMultiple, PERMISSIONS } from 'react-native-permissions'
import { Camera } from 'expo-camera'

const html = `
<!-- 

    Using as proof of concept, for using WebView to have WebRTC support in Expo apps
    
    Everything besides throwing everything in one file and switching to a CDN, this was
    authored by Jeff Delaney. https://github.com/fireship-io/webrtc-firebase-demo

-->
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WebRTC Demo</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&display=swap');

            body {
                font-family: 'Syne Mono', monospace;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-align: center;
                color: #2c3e50;
                margin: 80px 10px;
            }

            video {
                width: 40vw;
                height: 30vw;
                margin: 2rem;
                background: #2c3e50;
            }

            .videos {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        </style>
    </head>
    <body>
        <h2>1. Start your Webcam</h2>
        <div class="videos">
            <span>
                <h3>Local Stream</h3>
                <video id="webcamVideo" autoplay playsinline></video>
            </span>
            <span>
                <h3>Remote Stream</h3>
                <video id="remoteVideo" autoplay playsinline></video>
            </span>
        </div>

        <button id="webcamButton">Start webcam</button>
        <h2>2. Create a new Call (server-side disabled)</h2>
        <button id="callButton" disabled>Create Call (offer)</button>

        <h2>3. Join a Call (server-side disabled)</h2>
        <p>Answer the call from a different browser window or device</p>

        <input id="callInput" />
        <button id="answerButton" disabled>Answer</button>

        <h2>4. Hangup</h2>

        <button id="hangupButton" disabled>Hangup</button>

        <!-- Firebase App (the core Firebase SDK) is always required and must be listed first -->
        <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>

        <!-- Add Firebase products that you want to use -->
        <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
        <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-firestore.js"></script>

        <script type="module">
            // Use your own config please, mine is write protected anyways
            // I'll be implementing all writes (create call, join call, and hang up) as cloud functions
            const firebaseConfig = {
                apiKey: 'AIzaSyBHpKV6SSJImZK1vJPGiJwKnogLBMkgfro',
                authDomain: 'cloud-lightning.firebaseapp.com',
                databaseURL: 'https://cloud-lightning.firebaseio.com',
                projectId: 'cloud-lightning',
                storageBucket: 'cloud-lightning.appspot.com',
                messagingSenderId: '357266467361',
                appId: '1:357266467361:web:627d7e1b7817256cfbd160',
                measurementId: 'G-CFXNQMD10X',
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig)
            }
            const firestore = firebase.firestore()

            const servers = {
                iceServers: [
                    {
                        urls: [
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                        ],
                    },
                ],
                iceCandidatePoolSize: 10,
            }

            // Global State
            const pc = new RTCPeerConnection(servers)
            let localStream = null
            let remoteStream = null

            // HTML elements
            const webcamButton = document.getElementById('webcamButton')
            const webcamVideo = document.getElementById('webcamVideo')
            const callButton = document.getElementById('callButton')
            const callInput = document.getElementById('callInput')
            const answerButton = document.getElementById('answerButton')
            const remoteVideo = document.getElementById('remoteVideo')
            const hangupButton = document.getElementById('hangupButton')

            // 1. Setup media sources
            webcamButton.onclick = async () => {
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                })

                alert('123')

                navigator.mediaDevices
                    .getUserMedia({
                        video: true,
                        audio: true,
                    })
                    .then((stream) => {
                        localStream = stream
                        remoteStream = new MediaStream()

                        const tracks = localStream.getTracks()

                        // Push tracks from local stream to peer connection
                        tracks.forEach((track) => {
                            pc.addTrack(track, localStream)
                        })

                        // Pull tracks from remote stream, add to video stream
                        pc.ontrack = (event) => {
                            event.streams?.[0].getTracks().forEach((track) => {
                                remoteStream.addTrack(track)
                            })
                        }

                        webcamVideo.srcObject = localStream
                        remoteVideo.srcObject = remoteStream

                        callButton.disabled = false
                        answerButton.disabled = false
                        webcamButton.disabled = true
                    })
                    .catch((exception) => {
                        alert(exception)
                    })
            }

            // 2. Create an offer
            callButton.onclick = async () => {
                // Reference Firestore collections for signaling
                const callDoc = firestore.collection('calls').doc()
                const offerCandidates = callDoc.collection('offerCandidates')
                const answerCandidates = callDoc.collection('answerCandidates')

                callInput.value = callDoc.id

                // Get candidates for caller, save to db
                pc.onicecandidate = (event) => {
                    event.candidate && offerCandidates.add(event.candidate.toJSON())
                }

                // Create offer
                const offerDescription = await pc.createOffer()
                await pc.setLocalDescription(offerDescription)

                const offer = {
                    sdp: offerDescription.sdp,
                    type: offerDescription.type,
                }

                await callDoc.set({ offer })

                // Listen for remote answer
                callDoc.onSnapshot((snapshot) => {
                    const data = snapshot.data()
                    if (!pc.currentRemoteDescription && data?.answer) {
                        const answerDescription = new RTCSessionDescription(data.answer)
                        pc.setRemoteDescription(answerDescription)
                    }
                })

                // When answered, add candidate to peer connection
                answerCandidates.onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const candidate = new RTCIceCandidate(change.doc.data())
                            pc.addIceCandidate(candidate)
                        }
                    })
                })

                hangupButton.disabled = false
            }

            // 3. Answer the call with the unique ID
            answerButton.onclick = async () => {
                const callId = callInput.value
                const callDoc = firestore.collection('calls').doc(callId)
                const answerCandidates = callDoc.collection('answerCandidates')
                const offerCandidates = callDoc.collection('offerCandidates')

                pc.onicecandidate = (event) => {
                    event.candidate && answerCandidates.add(event.candidate.toJSON())
                }

                const callData = (await callDoc.get()).data()

                const offerDescription = callData.offer
                await pc.setRemoteDescription(new RTCSessionDescription(offerDescription))

                const answerDescription = await pc.createAnswer()
                await pc.setLocalDescription(answerDescription)

                const answer = {
                    type: answerDescription.type,
                    sdp: answerDescription.sdp,
                }

                await callDoc.update({ answer })

                offerCandidates.onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        console.log(change)
                        if (change.type === 'added') {
                            let data = change.doc.data()
                            pc.addIceCandidate(new RTCIceCandidate(data))
                            hangupButton.disabled = false
                        }
                    })
                })
            }
        </script>
    </body>
</html>
`

// App Component
export default () => {
    const [isLoading, setIsLoading] = useState(true)
    const [webView, setWebView] = useState<HTMLIFrameElement>()
    const [document, setDocument] = useState<Document>()

    useEffect(() => {
        if (webView !== undefined) {
            setIsLoading(false)
            console.log(document)
        }
    }, [webView])

    useEffect(() => {
        Camera.requestPermissionsAsync().catch((err) => {
            console.log('---------------------------------------')
            console.error(err)
        })
    }, [])

    //
    //  This will probably not work with Expo Go
    //
    // useEffect(() => {        
    //     const effect = async () => {
    //         await requestMultiple([PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO]);
    //     };

    //     effect().catch(console.log);
    // }, []);

    useEffect(() => {
        console.info(`WebView is${isLoading ? ' ' : ' not '}loading`)
    }, [isLoading])

    const onLoad = ({ target }: { target: HTMLIFrameElement }) => {
        console.log('onLoad')
        setWebView(target)
        setDocument(target.contentDocument ? target.contentDocument : undefined)
    }

    const onError = ({ nativeEvent }: WebViewErrorEvent) => {
        console.error(`WebView Error: ${nativeEvent.description}`)
    }

    // Web Platform
    if (Platform.OS === 'web')
        return (
            <View style={{ flex: 1 }}>
                <WebViewWeb
                    style={{ flex: 1 }}
                    originWhitelist={['*']}
                    allowUniversalAccessFromFileURLs={true}
                    allowsBackForwardNavigationGestures={false}
                    allowsFullscreenVideo={true}
                    allowsInlineMediaPlayback={true}
                    bounces={false}
                    mediaPlaybackRequiresUserAction={false}
                    source={{ html }}
                    onError={onError}
                    onLoad={onLoad}
                />
            </View>
        )

    // Sources...
    // const source = { html }
    const source = { uri: 'https://cloud-lightning.web.app/WebRTC.html', baseUrl: '' }
    // const source = { uri: 'file:///android_asset/WebRTC.html' } // For Android, but problem... With Expo Go, it's Expo Go's asset folder
    // const source = { uri: 'https://cloud-lightning.web.app/WebRTC.html', baseUrl: 'https://cloud-lightning.web.app' }

    // Native WebView's
    return (
        <View style={{ flex: 1 }}>
            <WebViewNative
                style={{ flex: 1 }}
                originWhitelist={['*']}
                allowUniversalAccessFromFileURLs={true}
                allowsBackForwardNavigationGestures={false}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                androidLayerType={'software'}
                bounces={false}
                mediaPlaybackRequiresUserAction={false}
                source={source}
                onError={onError}
                onLoad={({ currentTarget }) => {
                    console.log('onLoad')
                }}
                onMessage={({ nativeEvent }) => {
                    console.log(`onMessage: ${nativeEvent.data}`)
                }}
                onShouldStartLoadWithRequest={(request) => {
                    console.log(request)
                    return true
                }}
                onHttpError={({ nativeEvent }) => {
                    console.error(nativeEvent.description)
                }}
                onNavigationStateChange={({ loading, navigationType, url, mainDocumentURL }) => {
                    console.log(url + ' ' + loading)
                    console.log(url + ' ' + loading)
                }}
                onLoadProgress={({ nativeEvent }) => {
                    console.log(nativeEvent.progress)
                }}
            />

        </View>
    )

}