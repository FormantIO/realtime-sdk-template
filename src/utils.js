const waitTime = 10000

// import { Credentials, AuthClient } from "@formant/realtime-sdk";
async function createRtcClientFromCredentials(credentials, receive) {  
    const getToken = async () => await credentials.getToken();
    const receive = (peerId, message) => console.log(message);
    
    const rtcClient = new RtcClient({
        signalingClient: new SignalingPromiseClient("https://api-dev.formant.io", null, null),
        getToken,
        receive,
    });

    while (!rtcClient.isReady()) {
        await delay(100);
    }

    return rtcClient
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}