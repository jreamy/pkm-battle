import React, { useState, useEffect, createContext, useContext } from "react";

import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { Libp2pOptions } from "./libp2p-config";

import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";

export const OrbitContext = createContext(); // Default value
export const useOrbit = () => useContext(OrbitContext);

export const OrbitProvider = ({ children }) => {
  const [ipfs, setIPFS] = useState();
  const [orbitdb, setOrbitDB] = useState();

  useEffect(() => {
    (async () => {
      // Create an IndexedDB datastore and blockstore
      const datastore = new IDBDatastore("datastore");
      const blockstore = new IDBBlockstore("blockstore");

      // Open the stores
      await datastore.open();
      await blockstore.open();

      localStorage.setItem("debug", "libp2p:pubsub");

      const ipfs = await createHelia({
        libp2p: {
          services: Libp2pOptions.services,
        },
        blockstore,
        datastore,
      });
      setIPFS(ipfs);

      const orbitdb = await createOrbitDB({ ipfs });
      setOrbitDB(orbitdb);
    })();

    return () => {
      if (orbitdb) {
        (async () => {
          await orbitdb.stop();
          await ipfs.stop();
        })();
      }
    };
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
