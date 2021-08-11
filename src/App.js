import React, { Component } from "react";
import "./App.css";
import { RtcClient, SignalingPromiseClient } from "@formant/realtime-sdk";

const formantApiUrl = "https://api.formant.io";
const decoder = new TextDecoder("utf-8");

// This app is meant to run as a custom web view in Formant
// with url e.g. http://localhost:3000/?auth={auth}&device={device_id}
class App extends Component {
    constructor() {
        super();
        this.deviceId = new URLSearchParams(window.location.search).get(
            "device"
        );
        this.dataChannel = undefined;
        this.canvas = undefined;
    }

    async componentDidMount() {
        // Create an instance of the real-time communication client
        const rtcClient = new RtcClient({
            signalingClient: new SignalingPromiseClient(
                formantApiUrl,
                null,
                null
            ),
            getToken: () =>
                new URLSearchParams(window.location.search).get("auth"),
            receive: (peerId, message) =>
                this.receiveRtcMessage(peerId, message),
        });

        // while (!rtcClient.isReady()) {
        //   console.log("Waiting for RTC client to initialize...")
        //   await delay(100);
        // }
        await delay(500); // TODO: update to latest realtime-sdk version and uncomment

        // Each online device and user has a peer in the system
        const peers = await rtcClient.getPeers();
        console.log(peers);

        // Find the device peer corresponding to the device's ID
        const devicePeer = peers.find((_) => _.deviceId !== undefined);
        if (!devicePeer) {
            // If the device is offline, we won't be able to find its peer.
            console.log("Failed to find device peer.");
            return;
        }

        // We can connect our real-time communication client to device peers by their ID
        const devicePeerId = devicePeer.id;
        await rtcClient.connect(devicePeerId);

        // WebRTC requires a signaling phase when forming a new connection.
        // Wait for the signaling process to complete...
        while (rtcClient.getConnectionStatus(devicePeerId) !== "connected") {
            await delay(100);
            console.log("Waiting for connection ...");
        }

        // Create a custom data channel to the device peer with a name, settings, and handlers.
        // The device-side application can send and receive messages
        // on this channel using the agent API.
        rtcClient.createCustomDataChannel(
            devicePeerId, // device peer to open the channel with
            "example-unreliable-channel", // channel name
            { ordered: false, maxRetransmits: 0 }, // channel settings
            true, // use binary data format
            (_, channel) => {
                this.dataChannel = channel;
                channel.onopen = () => {
                    console.log("Channel opened.");
                };
                channel.onmessage = (event) => this.onChannelEvent(event);
            }
        );
    }

    onChannelEvent(event) {
        console.log("rcv");
        let object;
        try {
            const encoded = decoder.decode(event.data);
            object = JSON.parse(encoded);
        } catch {
            console.log("Error decoding data channel event");
        }
        console.log(object);
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <p>Real-time SDK Template</p>
                </header>
            </div>
        );
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default App;
