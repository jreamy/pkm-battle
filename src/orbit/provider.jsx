import React, { useState, useEffect, createContext, useContext } from "react";

import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { Libp2pOptions } from "./libp2p-config";

import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";

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

      // Open the stores
      await datastore.open();
      await blockstore.open();

      const ipfs = await createHelia({
        libp2p: Libp2pOptions,
        blockstore,
        datastore,
      });
      setIPFS(ipfs);

      const orbitdb = await createOrbitDB({ ipfs });
      setOrbitDB(orbitdb);
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);

      if (ipfs?.libp2p && !ipfs.libp2p.getConnections().length) {
        const old = [ipfs, orbitdb];
        init();
        (async () => {
          if (old.orbitdb) {
            await old.orbitdb.close();
          }
          if (old.ipfs) {
            await old.ipfs.close();
          }
        })();
      }
    }, 30_000);
  }, [ipfs]);

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
