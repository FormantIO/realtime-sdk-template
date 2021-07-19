import React, { Component} from 'react';
import './App.css';
import { RtcClient, Credentials, RtcSignalingClient, SignalingPromiseClient, AuthClient } from 'teleop-client';
import { delay } from "./utils";

class App extends Component {
  constructor() {
    super()
    const url = window.location.href;
    this.userId = url.searchParams.get("deviceId");
    this.deviceId = url.searchParams.get("deviceId");
    this.token = url.searchParams.get("token");
    // var c = url.searchParams.get("c");
    // this.deviceId = 
    this.dataChannel = undefined;
    this.canvas = undefined;
  }

  async componentDidMount() {  
    const peers = await rtcClient.getPeers()
    console.log(peers);

    const devicePeer = peers.find(_ => _.deviceId !== undefined)
    if (!devicePeer) {
      console.log("Failed to find device peer.")
      return
    }

    const devicePeerId = devicePeer.id;

    await delay(1000);

    const sessionId = await rtcClient.connect(devicePeerId)
    console.log(sessionId);

    while (rtcClient.getConnectionStatus(devicePeerId) !== "connected") {
        await delay(100);
        console.log("waiting for connection")
    }

    const decoder = new TextDecoder('utf-8')

    rtcClient.createCustomDataChannel(
      devicePeerId,
      "test-sdk",
      {
        ordered: false,
        maxRetransmits: 0
      },
      true,
      (_, channel) => {
        this.dataChannel = channel;
        channel.onopen = () => {
          console.log("channel opened")
        }
        channel.onmessage = (event) => {
          console.log("rcv")
          const encoded = decoder.decode(event.data);
          const d = JSON.parse(encoded);
          if (!this.canvas) {
            return
          }
          this.canvas.width = 10 * d.width;
          this.canvas.height = 10 * d.height;
          const ctx = this.canvas.getContext("2d");

          for (let i=0; i < d.data.length; i++) {
            const width = 10 * (i % 60)
            const height = 10 * Math.floor((i / 60.0))
            ctx.shadowBlur = d.data[i];
            ctx.strokeStyle='white';
            ctx.shadowColor='blue';

            ctx.fillStyle = `rgba(255, 255, 255, ${d.data[i]/100.0})`;
            ctx.fillRect(width,height,10,10);
            ctx.lineWidth=1;
            ctx.shadowOffsetX=0;
            ctx.shadowOffsetY=0;
            // ctx.shadowBlur=25;
          }

          // console.log(d.data.length)

          // console.log(d.width, d.height)
          // console.log(message)
          // console.log("rcv ms")
        }
        channel.onerror = () => {
          console.log("channel error")
        }
      },
    )
  }

  render() {
    this.setCanvasRef = element => {
      this.canvas = element;
    };


    return (
      <div className="App">
        <header className="App-header">
        <p>Real-time SDK Demo</p>
        <canvas ref={this.setCanvasRef} width={60} height={60} />
        </header>
      </div>
    );
  }
}

export default App;
