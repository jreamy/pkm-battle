import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useOrbit } from "./contexts/orbitdb";

function App() {
  const [count, setCount] = useState(0);
  const { db, ipfs } = useOrbit();

  useEffect(() => {
    if (db) {
      db.events.on("update", async () => {
        const all = await db.all();
        console.log(all);
        setCount(all.length);
      });
    }
  }, [db]);

  const [peers, setPeers] = useState(0);

  setInterval(async () => {
    if (ipfs) {
      const peers = await ipfs.libp2p.peerStore.all();
      setPeers(peers.length);
    }
  }, 3000);

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
        <button onClick={async () => db.add("world")}>count is {count}</button>
        <button onClick={async () => {}}>peers: {peers}</button>
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
