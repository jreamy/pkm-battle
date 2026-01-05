import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { delegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { delegatedHTTPRoutingDefaults } from "@helia/routers";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import { identify, identifyPush } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";
import { ipnsSelector } from "ipns/selector";
import { ipnsValidator } from "ipns/validator";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";

export const bootstrapConfig = {
  list: [
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
    "/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8",
    "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
  ],
};

export const Libp2pOptions = {
  addresses: {
    listen: ["/p2p-circuit", "/webrtc"],
  },
  transports: [circuitRelayTransport(), webRTC(), webRTCDirect(), webSockets()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: async () => {
      return false;
    },
  },
  peerDiscovery: [
    bootstrap(bootstrapConfig),
    pubsubPeerDiscovery({
      interval: 10000,
      topics: [
        `_pmk_battle._peer-discovery._p2p._pubsub`,
        "_peer-discovery._p2p._pubsub",
      ],
    }),
  ],
  services: {
    autoNAT: autoNAT(),
    dcutr: dcutr(),
    delegatedRouting: () =>
      delegatedRoutingV1HttpApiClient(
        "https://delegated-ipfs.dev",
        delegatedHTTPRoutingDefaults(),
      ),
    dht: kadDHT({
      clientMode: true,
      validators: {
        ipns: ipnsValidator,
      },
      selectors: {
        ipns: ipnsSelector,
      },
    }),
    identify: identify(),
    identifyPush: identifyPush(),
    ping: ping(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  },
};
