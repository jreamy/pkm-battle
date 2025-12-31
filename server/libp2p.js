import { tcp } from "@libp2p/tcp";
import { tls } from "@libp2p/tls";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createDelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { delegatedHTTPRoutingDefaults } from "@helia/routers";
import { autoNAT } from "@libp2p/autonat";
import { autoTLS } from "@ipshipyard/libp2p-auto-tls";
import { bootstrap } from "@libp2p/bootstrap";
import {
  circuitRelayTransport,
  circuitRelayServer,
} from "@libp2p/circuit-relay-v2";
import { dcutr } from "@libp2p/dcutr";
import { http } from "@libp2p/http";
import { identify, identifyPush } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { ipnsSelector } from "ipns/selector";
import { ipnsValidator } from "ipns/validator";

export const bootstrapConfig = {
  list: [
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
    // va1 is not in the TXT records for _dnsaddr.bootstrap.libp2p.io yet
    // so use the host name directly
    "/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8",
    "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
  ],
};

export const Libp2pOptions = {
  addresses: {
    listen: [
      // "/ip4/0.0.0.0/tcp/0",
      "/ip4/0.0.0.0/tcp/0/ws",
      "/ip4/0.0.0.0/udp/0/webrtc-direct",
      // "/ip6/::/tcp/0",
      "/ip6/::/tcp/0/ws",
      "/ip6/::/udp/0/webrtc-direct",
      "/p2p-circuit",
      "/webrtc",
    ],
  },
  transports: [
    circuitRelayTransport(),
    tcp(),
    webRTC(),
    webRTCDirect(),
    webSockets(),
  ],
  connectionGater: {
    denyDialMultiaddr: () => false,
  },
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  peerDiscovery: [bootstrap(bootstrapConfig)],
  services: {
    autoNAT: autoNAT(),
    // autoTLS: autoTLS(),
    dcutr: dcutr(),
    delegatedRouting: () =>
      createDelegatedRoutingV1HttpApiClient(
        "https://delegated-ipfs.dev",
        delegatedHTTPRoutingDefaults(),
      ),
    dht: kadDHT({
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
    relay: circuitRelayServer(),
    // upnp: uPnPNAT(),
    http: http(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  },
};
