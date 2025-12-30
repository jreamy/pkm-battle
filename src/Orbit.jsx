import React, { useState, useEffect, useMemo } from "react";
import OrbitContext from "./contexts/orbitdb";

import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { createLibp2p } from "libp2p";

import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";
import { Libp2pOptions } from "./orbit/libp2p-config";

const OrbitProvider = ({ children }) => {
  const [db, setDB] = useState();
  const [ipfs, setIPFS] = useState();
  const [orbitdb, setOrbitDB] = useState();
  const [libp2p, setLibp2p] = useState();

  const { search } = window.location;

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const db_id = queryParams.get("db-id");

  useEffect(() => {
    (async () => {
      // Create an IndexedDB datastore and blockstore
      const datastore = new IDBDatastore("datastore");
      const blockstore = new IDBBlockstore("blockstore");

      // Open the stores
      await datastore.open();
      await blockstore.open();

      console.log(blockstore);
      console.log(datastore);

      const libp2p = await createLibp2p({ ...Libp2pOptions });
      setLibp2p(libp2p);
      console.log(libp2p);

      const ipfs = await createHelia({
        libp2p,
        // blockstore,
        // datastore,
      });
      setIPFS(ipfs);
      console.log(ipfs);

      const orbitdb = await createOrbitDB({ ipfs });
      setOrbitDB(orbitdb);
      console.log(orbitdb);

      // Create / Open a database. Defaults to db type "events".

      const db = await orbitdb.open(
        db_id ? db_id + "/event-stream" : "event-stream",
      );
      if (!db_id) {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        searchParams.set("db-id", db.address);
        history.replaceState(null, "", url.toString());
      }
      setDB(db);
      console.log(db.address, db_id);
    })();

    return () => {
      if (db) {
        (async () => {
          await db.close();
          await orbitdb.stop();
          await ipfs.stop();
        })();
      }
    };
  }, []);

  const value = {
    db,
    ipfs,
    orbitdb,
    libp2p,
  };

  return <OrbitContext value={value}>{children}</OrbitContext>;
};

export default OrbitProvider;
