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
      db.events.on("update", async () => {
        const all = await db.all();
        setCount(all.length);
      });
    }
  }, [db]);

  const [peers, setPeers] = useState(0);
  const [conns, setConns] = useState(0);

  useEffect(() => {
    if (ipfs) {
      // Set up the interval
      const intervalId = setInterval(async () => {
        setConns(ipfs.libp2p.getConnections().length);
        const peers = await ipfs.libp2p.peerStore.all();
        setPeers(peers.length);
      }, 3000);

      // Clean up the interval when the component unmounts or the effect re-runs
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [ipfs]);

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
            if (conn) {
              conn.close();
              setConn(null);
            } else if (ipfs?.libp2p) {
              console.log("connecting to " + peerID);
              let conn;
              try {
                conn = await ipfs?.libp2p.dial(peerIdFromString(peerID));
              } catch (err) {
                ipfs.libp2p.peerStore.delete(peerIdFromString(peerID));
                const peerInfo = await ipfs?.libp2p?.peerRouting?.findPeer(
                  peerIdFromString(peerID),
                  { timeout: 5000 },
                );
                console.log(peerInfo);
                conn = await ipfs?.libp2p.dial(peerIdFromString(peerID));
              }

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
        <button onClick={async () => db.add("world")}>count is {count}</button>
        <button onClick={async () => {}}>peers: {peers}</button>
        <button onClick={async () => {}}>conns: {conns}</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
