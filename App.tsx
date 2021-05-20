import React, { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
// @ts-expect-error
import { WebView as WebViewWeb } from 'react-native-web-webview'
import { WebView as WebViewNative, WebViewProps } from 'react-native-webview'
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes'

const html = Platform.OS === 'web' ? require('./assets/WebRTC.html') : ''

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
        console.info(`WebView is${isLoading ? ' ' : ' not '}loading`)
    }, [isLoading])

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
                    onError={({ nativeEvent }: WebViewErrorEvent) => {
                        console.error(`WebView Error: ${nativeEvent.description}`)
                    }}
                    onLoad={({ target }: { target: HTMLIFrameElement }) => {
                        setWebView(target)
                        setDocument(target.contentDocument ? target.contentDocument : undefined)
                    }}
                />
            </View>
        )

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
                androidLayerType={'hardware'}
                bounces={false}
                mediaPlaybackRequiresUserAction={false}
                // source={{ uri: 'file:///android_asset/WebRTC.html' }} // For Android, but problem... With Expo Go, it's Expo Go's asset folder
                source={{ uri: 'https://cloud-lightning.web.app/WebRTC.html' }}
                onError={({ nativeEvent }) => {
                    console.error(`WebView Error: ${nativeEvent.description}`)
                }}
                onLoad={({ target }) => {
                    // @ts-expect-error
                    const webViewTarget = target as HTMLIFrameElement
                    setWebView(webViewTarget)
                    setDocument(webViewTarget.contentDocument ? webViewTarget.contentDocument : undefined)
                }}
            />

        </View>
    )

}