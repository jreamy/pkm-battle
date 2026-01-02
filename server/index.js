import { createHelia, libp2pDefaults } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { LevelBlockstore } from "blockstore-level";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { FaultTolerance } from "@libp2p/interface-transport";
import { createLibp2p } from "libp2p";
import { http } from "@libp2p/http";

// Create an IPFS instance.
const cfg = libp2pDefaults();
cfg.services.pubsub = gossipsub({ allowPublishToZeroTopicPeers: true });
cfg.connectionGater = { denyDialMultiaddr: () => false };
cfg.transportManager = {
  faultTolerance: FaultTolerance.NO_FATAL,
};
cfg.services.http = http();

const blockstore = new LevelBlockstore("./data/ipfs/blocks");
const libp2p = await createLibp2p(cfg);
const ipfs = await createHelia({
  //   libp2p,
  libp2p: cfg,
  blockstore,
});

const orbitdb = await createOrbitDB({ ipfs, directory: `./data/orbitdb` });

const db = await orbitdb.open("my-db");

console.log("my-db address", db.address);
console.log("peer id:", ipfs.libp2p.peerId.toString());

// // Add some records to the db.
// await db.add("hello world 1");
// await db.add("hello world 2");

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
