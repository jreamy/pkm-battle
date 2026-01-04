import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createDelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { delegatedHTTPRoutingDefaults } from "@helia/routers";
import { autoNAT } from "@libp2p/autonat";
import { dcutr } from "@libp2p/dcutr";
import { http } from "@libp2p/http";
import { identify, identifyPush } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { ping } from "@libp2p/ping";
import { ipnsSelector } from "ipns/selector";
import { ipnsValidator } from "ipns/validator";

export const Libp2pOptions = {
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  connectionGater: { denyDialMultiaddr: () => false },
  services: {
    autoNAT: autoNAT(),
    dcutr: dcutr(),
    delegatedRouting: () =>
      createDelegatedRoutingV1HttpApiClient(
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
    http: http(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  },
};
