import { createHelia, libp2pDefaults } from "helia";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { LevelBlockstore } from "blockstore-level";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { FaultTolerance } from "@libp2p/interface-transport";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";

// Create an IPFS instance.
const cfg = libp2pDefaults();
cfg.services.pubsub = gossipsub({ allowPublishToZeroTopicPeers: true });
cfg.connectionGater = { denyDialMultiaddr: () => false };
cfg.transportManager = {
  faultTolerance: FaultTolerance.NO_FATAL,
};
cfg.peerDiscovery.push(
  pubsubPeerDiscovery({
    interval: 10000,
    topics: [
      `_pmk_battle._peer-discovery._p2p._pubsub`,
      "_peer-discovery._p2p._pubsub",
    ],
  }),
);

const blockstore = new LevelBlockstore("./data/ipfs/blocks");
const ipfs = await createHelia({
  libp2p: cfg,
  blockstore,
});

const orbitdb = await createOrbitDB({ ipfs, directory: `./data/orbitdb` });

const db = await orbitdb.open("my-db", {
  AccessController: IPFSAccessController({
    write: ["*"],
  }),
});

console.log("my-db address", db.address);
console.log("peer id:", ipfs.libp2p.peerId.toString());

const intervalId = setInterval(async () => {
  const peers = await ipfs.libp2p.peerStore.all();
  const conns = ipfs.libp2p.getConnections().length;

  const all = await db.all();
  console.log({
    peers: peers?.length,
    counter: all?.length,
    conns,
  });
}, 5000);

// Start reading from stdin so the process doesn't exit immediately
process.stdin.resume();

// Catch the SIGINT event
process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
  clearInterval(intervalId);

  // Perform any necessary cleanup here (e.g., closing database connections, saving data)
  // ... your cleanup code ...
  // Close your db and stop OrbitDB and IPFS.
  await db.close();
  await orbitdb.stop();
  await ipfs.stop();

  // Optional: Add a short delay to ensure logs are flushed or async tasks complete
  setTimeout(() => {
    process.exit(0); // Exit the process with a success code
  }, 500);
});
