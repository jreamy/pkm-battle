import React, { useState, useEffect, createContext, useContext } from "react";

import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { Libp2pOptions } from "./libp2p-config";

import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
// import { LevelBlockstore } from "blockstore-level";

export const OrbitContext = createContext(); // Default value
export const useOrbit = () => useContext(OrbitContext);

export const OrbitProvider = ({ children }) => {
  const [ipfs, setIPFS] = useState();
  const [orbitdb, setOrbitDB] = useState();

  const init = () => {
    (async () => {
      // Create an IndexedDB datastore and blockstore
      const datastore = new IDBDatastore("datastore");
      const blockstore = new IDBBlockstore("blockstore");
      //   const blockstore = new LevelBlockstore("./blockstore");

      // Open the stores
      await datastore.open();
      await blockstore.open();

      // localStorage.setItem("debug", "libp2p:gossipsub*");
      // localStorage.setItem("debug", "libp2p:webrtc*");
      localStorage.setItem("debug", "libp2p:connection-manager*");
      // localStorage.setItem("debug", "libp2p:no-logs");

      // const alias = await createHelia({
      //   libp2p: Libp2pOptions,
      // });

      const ipfs = await createHelia({
        libp2p: Libp2pOptions,
        blockstore,
        datastore,
      });
      setIPFS(ipfs);

      const orbitdb = await createOrbitDB({ ipfs });
      setOrbitDB(orbitdb);

      // const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      // while (true) {
      //   const ipfs = await createHelia({
      //     libp2p: Libp2pOptions,
      //     blockstore,
      //     datastore,
      //   });
      //   setIPFS(ipfs);
      //   console.log({ ipfs });

      //   for (let i = 0; i < 5; i++) {
      //     try {
      //       const conn = await alias.libp2p.dial(ipfs.libp2p.peerId);
      //       if (conn?.status === "open") {
      //         const orbitdb = await createOrbitDB({ ipfs });
      //         setOrbitDB(orbitdb);
      //         console.log("initialized");
      //         await alias.stop();
      //         return;
      //       }
      //     } catch (err) {
      //       console.log(`failed to dial ${err}`);
      //     }
      //     await sleep((i + 1) * 1000);
      //   }

      //   await ipfs.stop();
      // }
    })();
  };

  const close = () => {
    if (orbitdb) {
      (async () => {
        await orbitdb.stop();
      })();
    }
    if (ipfs) {
      async () => {
        await ipfs.stop();
      };
    }
  };

  useEffect(() => {
    init();
    return close;
  }, []);

  const value = {
    ipfs,
    orbitdb,
  };

  return <OrbitContext value={value}>{children}</OrbitContext>;
};

export const useDB = (init) => {
  const [params, setParams] = useState(init);
  const [db, setDB] = useState();
  const { orbitdb } = useOrbit();

  useEffect(() => {
    (async () => {
      if (params?.id) {
        console.log("joining " + params?.id);
        const newDB = await orbitdb.open(params.id, params?.options);
        setDB(newDB);
        console.log("joined " + newDB?.address);
      }
    })();

    return () => {
      if (db) db?.close();
    };
  }, [params]);

  return [db, setParams];
};
