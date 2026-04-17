import { useEffect, useState, useMemo, useCallback } from "react";
import { DbConnection, tables } from "./module_bindings";

function toDate(val) {
  if (val === undefined || val === null) return new Date(0)
  const n = typeof val === 'bigint' ? val : BigInt(val)
  return n > 1000000000000n ? new Date(Number(n / 1000n)) : new Date(Number(n) * 1000)
}

function formatDate(val) {
  const d = toDate(val)
  return d.toLocaleDateString('el-GR') + ' ' + d.toLocaleTimeString('el-GR')
}

function App() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    const HOST = "https://maincloud.spacetimedb.com";
    const DB_NAME = "alarm";
    const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
    const savedToken = localStorage.getItem(TOKEN_KEY);

    const conn = DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(savedToken || undefined)
      .onConnect((conn, identity, token) => {
        setConnected(true);
        localStorage.setItem(TOKEN_KEY, token);

        conn.subscriptionBuilder()
          .onApplied(() => {
            try {
              setLogs([...conn.db.DeviceLog.iter()]);
            } catch (e) {
              console.error(e);
            }
          })
          .onError((ctx, err) => {
            alert(`Subscription απέτυχε: ${err?.message || err}`);
          })
          .subscribe([tables.DeviceLog]);

        conn.db.DeviceLog.onInsert(() => {
          setLogs([...conn.db.DeviceLog.iter()]);
        });
        conn.db.DeviceLog.onDelete(() => {
          setLogs([...conn.db.DeviceLog.iter()]);
        });
      })
      .onConnectError((ctx, err) => {
        alert(`Σύνδεση απέτυχε: ${err?.message || err}`);
      })
      .build();

    return () => conn.disconnect();
  }, []);

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      return toDate(b.insertedAt).getTime() - toDate(a.insertedAt).getTime()
    })
  }, [logs]);

  const grouped = useMemo(() => {
    return sorted.reduce((acc, log) => {
      const date = toDate(log.insertedAt).toLocaleDateString('el-GR')
      if (!acc[date]) acc[date] = []
      acc[date].push(log)
      return acc
    }, {})
  }, [sorted]);

  const toggleGroup = useCallback((date) => {
    setOpenGroups(prev => ({ ...prev, [date]: !prev[date] }))
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #080810;
          color: #c8d0e0;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          gap: 24px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1px solid #13131f;
        }

        .header-left { display: flex; align-items: center; gap: 16px; }

        .title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .badge {
          background: #13131f;
          border: 1px solid #1e1e30;
          border-radius: 6px;
          padding: 4px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: ${connected ? '#4ade80' : '#f87171'};
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .badge::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${connected ? '#4ade80' : '#f87171'};
          box-shadow: 0 0 6px ${connected ? '#4ade80' : '#f87171'};
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .stat {
          background: #0d0d18;
          border: 1px solid #13131f;
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-label {
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #3d4060;
          font-family: 'JetBrains Mono', monospace;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -1px;
        }

        .stat-sub {
          font-size: 0.72rem;
          color: #3d4060;
          font-family: 'JetBrains Mono', monospace;
        }

        .content {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          flex: 1;
          align-items: start;
        }

        .card {
          background: #0d0d18;
          border: 1px solid #13131f;
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          padding: 14px 20px;
          border-bottom: 1px solid #13131f;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #3d4060;
          font-family: 'JetBrains Mono', monospace;
        }

        .count-pill {
          background: #13131f;
          border-radius: 20px;
          padding: 2px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: #6366f1;
        }

        table { width: 100%; border-collapse: collapse; }

        thead th {
          padding: 10px 20px;
          text-align: left;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #252535;
          font-family: 'JetBrains Mono', monospace;
          border-bottom: 1px solid #13131f;
          font-weight: 500;
        }

        tbody tr {
          border-bottom: 1px solid #0f0f1a;
          transition: background 0.1s;
        }

        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: #10101c; }

        tbody td {
          padding: 11px 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76rem;
          color: #4a5070;
        }

        tbody td.device { color: #6366f1; font-weight: 500; }
        tbody td.time { color: #8890a8; }

        .empty {
          padding: 48px 20px;
          text-align: center;
          color: #1e1e30;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
        }

        .group-header {
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          border-bottom: 1px solid #0f0f1a;
          transition: background 0.1s;
          user-select: none;
        }

        .group-header:hover { background: #10101c; }

        .group-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: #3d4060;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .group-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .group-count {
          background: #13131f;
          border-radius: 20px;
          padding: 2px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          color: #6366f1;
        }

        .chevron {
          font-size: 0.6rem;
          color: #3d4060;
          transition: transform 0.2s;
          display: inline-block;
        }

        .chevron.open { transform: rotate(180deg); }

        @media (max-width: 768px) {
          .app { padding: 16px; }
          .content { grid-template-columns: 1fr; }
          .stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="app">
        <div className="header">
          <div className="header-left">
            <h1 className="title">Alarm Logs</h1>
            <div className="badge">{connected ? "LIVE" : "OFFLINE"}</div>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{logs.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Last Event</div>
            <div className="stat-value" style={{ fontSize: "1rem", paddingTop: "4px" }}>
              {sorted.length > 0 ? toDate(sorted[0].insertedAt).toLocaleTimeString('el-GR') : "—"}
            </div>
            {sorted.length > 0 && (
              <div className="stat-sub">{toDate(sorted[0].insertedAt).toLocaleDateString('el-GR')}</div>
            )}
          </div>
          <div className="stat">
            <div className="stat-label">Last Device</div>
            <div className="stat-value" style={{ fontSize: "1rem", paddingTop: "4px" }}>
              {sorted.length > 0 ? sorted[0].deviceId : "—"}
            </div>
          </div>
        </div>

        <div className="content">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent</span>
              <span className="count-pill">5</span>
            </div>
            {sorted.length === 0 ? (
              <div className="empty">No events yet</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Device</th><th>Date &amp; Time</th></tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td className="device">{log.deviceId}</td>
                      <td className="time">{formatDate(log.insertedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">All Logs</span>
              <span className="count-pill">{logs.length}</span>
            </div>
            {Object.keys(grouped).length === 0 ? (
              <div className="empty">No events recorded yet</div>
            ) : (
              Object.entries(grouped).map(([date, entries]) => (
                <div key={date}>
                  <div className="group-header" onClick={() => toggleGroup(date)}>
                    <span className="group-date">{date}</span>
                    <div className="group-right">
                      <span className="group-count">{entries.length}</span>
                      <span className={`chevron ${openGroups[date] ? 'open' : ''}`}>▼</span>
                    </div>
                  </div>
                  {openGroups[date] && (
                    <table>
                      <thead>
                        <tr><th>Device</th><th>Time</th></tr>
                      </thead>
                      <tbody>
                        {entries.map((log) => (
                          <tr key={log.id}>
                            <td className="device">{log.deviceId}</td>
                            <td className="time">{toDate(log.insertedAt).toLocaleTimeString('el-GR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;