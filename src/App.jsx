import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useDB, useOrbit } from "./orbit/provider.jsx";
import { peerIdFromString } from "@libp2p/peer-id";
import { IPFSAccessController } from "@orbitdb/core";

const addrRegex = /.*\/p2p\/(.*)\/.*\/?p2p-circuit\/.*\/?p2p\/.*/;

function App() {
  const [count, setCount] = useState(0);
  const { ipfs } = useOrbit();
  const [id, setID] = useState("");
  const [db, setDB] = useDB();

  const [peerID, setPeerID] = useState("");
  const [conn, setConn] = useState();
  const [peerConns, setPeerConns] = useState([]);
  const [addrs, setAddrs] = useState([]);

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

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [ipfs]);

  // const checkAddress = async () => {
  //   console.log("starting ping routine", { ipfs, alias });
  //   for (const addr of ipfs?.libp2p?.getMultiaddrs()) {
  //     const peerID = addr.toString().match(addrRegex)?.[1];
  //     console.log(await ipfs.libp2p.peerStore.get(peerIdFromString(peerID)));
  //     if (peerID) {
  //       try {
  //         console.log(`pinging ${peerID}`);
  //         console.log({ addr });
  //         console.log(await alias.libp2p.services.ping.ping(addr));
  //       } catch (err) {
  //         console.log(`hanging up: ${err}`);
  //         await ipfs.libp2p.hangUp(addr);
  //         ipfs.libp2p.peerStore.delete(peerIdFromString(peerID));
  //       }
  //     }
  //   }
  // };

  // useEffect(() => {
  //   if (ipfs && alias) {
  //     checkAddress();

  //     const intervalId = setInterval(checkAddress, 30000);
  //     return () => {
  //       clearInterval(intervalId);
  //     };
  //   }
  // }, [ipfs, alias]);

  // useEffect(() => {
  //   if (ipfs) {
  //     const intervalId = setInterval(async () => {
  //       for (const peerID of new Set(
  //         ipfs?.libp2p
  //           ?.getMultiaddrs()
  //           .map((addr) => addr.toString().match(addrRegex)?.[1]),
  //       )) {
  //         if (peerID) {
  //           try {
  //             console.log(`pinging ${peerID}`);
  //             console.log(
  //               await ipfs.libp2p.services.ping.ping(peerIdFromString(peerID)),
  //             );
  //           } catch (err) {
  //             console.log(`ping failed: ${err}`);
  //           }
  //         }
  //       }
  //     }, 1000);

  //     return () => {
  //       clearInterval(intervalId);
  //     };
  //   }
  // }, [ipfs]);

  useEffect(() => {
    if (peerID && (!conn || conn?.status === "closed")) {
      const conns = ipfs?.libp2p?.getConnections(peerIdFromString(peerID));
      setPeerConns(conns);
      if (conns?.length) {
        setConn(conns[0]);
      }
    }
  }, [conn?.status, peerID]);

  useEffect(() => {
    if (ipfs) {
      const intervalId = setInterval(async () => {
        if (peerID) {
          const conns = ipfs?.libp2p?.getConnections(peerIdFromString(peerID));
          if (!conns?.length) {
            try {
              const conn = await ipfs?.libp2p?.dial(peerIdFromString(peerID));
              console.log(conn);
              setConn(conn);
            } catch (err) {
              console.log(`failed to dial ${peerID}: ${err}`);
            }
          } else {
            console.log({ conns });
            for (const conn of conns) {
              if (conn.remoteAddr.toString().startsWith("/webrtc")) {
                console.log(
                  `ping ${conn.remoteAddr}: ${await ipfs.libp2p.services.ping.ping(conn.remoteAddr)}`,
                );
              }
            }
          }
          setPeerConns(conns);
        }
        // console.log(conns);

        const addrs = ipfs?.libp2p?.getMultiaddrs();
        setAddrs(addrs);
        // console.log(addrs);
      }, 3000);

      // Clean up the interval when the component unmounts or the effect re-runs
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [ipfs, peerID]);

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
                return;
              }

              console.log("connecting to " + peerID);
              let conn;
              try {
                console.log("attempt 1");
                console.log(await ipfs.libp2p.peerStore.getInfo(peer));
                conn = await ipfs?.libp2p.dial(peer, {
                  onProgress: (evt) => {
                    console.log(evt);
                  },
                });
              } catch (err) {
                console.log("attempt 2");
                await ipfs.libp2p.peerStore.delete(peer);
                const peerInfo = await ipfs?.libp2p?.peerRouting?.findPeer(
                  peer,
                  { timeout: 5000 },
                );
                console.log(peerInfo);
                conn = await ipfs?.libp2p.dial(peer, {
                  onProgress: (evt) => {
                    console.log(evt);
                  },
                });
              }

              if (conn) {
                await ipfs.libp2p.peerStore.merge(peer, {
                  tags: {
                    "keep-alive-pkm-battle": {
                      value: 100,
                    },
                  },
                });
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
              id: "jack-test-events",
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
      peer:
      {peerConns.map((x, idx) => (
        <p key={`peer-${idx}`}>{x.remoteAddr.toString()}</p>
      ))}
      <br />
      my: (
      {
        new Set(
          addrs
            .map((addr) => addr.toString().match(addrRegex)?.[1])
            .filter((x) => x),
        ).size
      }{" "}
      / {addrs?.length})
    </>
  );
}

export default App;
