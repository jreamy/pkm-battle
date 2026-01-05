import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useDB, useOrbit } from "./orbit/provider.jsx";
import { peerIdFromString } from "@libp2p/peer-id";
import { IPFSAccessController } from "@orbitdb/core";

function App() {
  const [count, setCount] = useState(0);
  const { ipfs } = useOrbit();
  const [id, setID] = useState("");
  const [db, setDB] = useDB();

  const [peerID, setPeerID] = useState("");
  const [conn, setConn] = useState();

  useEffect(() => {
    if (db?.events) {
      db.events.on("update", async (event) => {
        console.log(event);
        const all = await db.all();
        setCount(all.length);
      });
      db.events.on("join", async (peerID, heads) => {
        console.log("joined by: " + peerID);
        const all = await db.all();
        setCount(all.length);
      });
      db.events.on("leave", async (peerID, heads) => {
        console.log("leaved by: " + peerID);
        const all = await db.all();
        setCount(all.length);
      });
    }
  }, [db]);

  const [conns, setConns] = useState(0);

  useEffect(() => {
    if (ipfs) {
      // Set up the interval
      const intervalId = setInterval(async () => {
        setConns(ipfs.libp2p.getConnections().length);
      }, 3000);

      // Clean up the interval when the component unmounts or the effect re-runs
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [ipfs]);

  useEffect(() => {
    if (!conn) {
      const conns = ipfs?.libp2p?.getConnections(peerIdFromString(peerID));
      if (conns?.length) {
        setConn(conns[0]);
      }
    }
  }, [conn?.status]);

  // useEffect(() => {
  //   if (peerID) {
  //     const intervalId = setInterval(async () => {
  //       const conns = ipfs.libp2p.getConnections(peerIdFromString(peerID));
  //       if (conns?.length) {
  //         console.log("pinging: " + conns[0].remoteAddr.toString());
  //         const latency = await ipfs.libp2p.services.ping.ping(
  //           conns[0].remoteAddr,
  //         );
  //         setPing(latency);
  //         if (!conn) {
  //           setConn(conns[0]);
  //         }
  //       }
  //     }, 1000);

  //     return () => {
  //       clearInterval(intervalId);
  //     };
  //   }
  // }, [peerID]);

  useEffect(() => {
    if (conn?.status === "closed") {
      const conns = ipfs.libp2p
        .getConnections(peerIdFromString(peerID))
        ?.filter((x) => x?.status === "open");
      if (conns?.length) {
        setConn(conns[0]);
      }
    }
  }, [conn]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <input
          type="text"
          value={peerID}
          onChange={(event) => setPeerID(event.target.value)}
        ></input>
        <button
          onClick={async () => {
            const peer = peerIdFromString(peerID);
            if (conn) {
              await conn.close();
              setConn(null);
            } else if (ipfs?.libp2p) {
              const conns = ipfs.libp2p.getConnections(peer);
              if (conns?.length) {
                console.log("reusing to " + peerID);
                setConn(conns[0]);

                console.log(
                  await ipfs.libp2p.peerStore.merge(peer, {
                    tags: {
                      "keep-alive": {
                        value: 100,
                      },
                    },
                  }),
                );
                return;
              }

              console.log("connecting to " + peerID);
              let conn;
              try {
                console.log("attempt 1");
                conn = await ipfs?.libp2p.dial(peer);
              } catch (err) {
                console.log("attempt 2");
                ipfs.libp2p.peerStore.delete(peer);
                const peerInfo = await ipfs?.libp2p?.peerRouting?.findPeer(
                  peer,
                  { timeout: 5000 },
                );
                console.log(peerInfo);
                conn = await ipfs?.libp2p.dial(peer);
              }
              console.log(
                await ipfs.libp2p.peerStore.merge(peer, {
                  tags: {
                    "keep-alive": {
                      value: 100,
                      minConnections: 1, // This is key to protecting the peer from being trimmed
                      maxConnections: 10,
                    },
                  },
                }),
              );

              console.log({ conn });
              setConn(conn);
            }
          }}
        >
          {conn ? conn.status : "connect"}
        </button>
        <br />
        <input
          type="text"
          value={id}
          onChange={(event) => setID(event.target.value)}
        ></input>
        <button
          onClick={async () =>
            setDB({ id: id, options: { create: false, timeout: 5000 } })
          }
        >
          join
        </button>
        <button
          onClick={async () =>
            setDB({
              id: "events",
              options: {
                AccessController: IPFSAccessController({
                  write: ["*"],
                }),
              },
            })
          }
        >
          new
        </button>
        <br />
        <button
          onClick={async () =>
            await navigator.clipboard.writeText(
              ipfs?.libp2p?.peerId ? ipfs?.libp2p?.peerId?.toString() : "",
            )
          }
        >
          peer id: {ipfs?.libp2p?.peerId?.toString()}
        </button>
        <br />
        <button
          onClick={async () =>
            await navigator.clipboard.writeText(
              db ? db?.address?.toString() : "",
            )
          }
        >
          db id: {db?.address}
        </button>
      </div>
      <div className="card">
        <button onClick={async () => await db.add("world")}>
          count is {count}
        </button>
        <button onClick={async () => {}}>conns: {conns}</button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
