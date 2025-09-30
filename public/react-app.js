const { createElement: h, useEffect } = React;

function App() {
  // Render static structure. All behavior is handled by existing app.js, which
  // attaches listeners and manipulates elements by id.
  // We keep IDs identical to the previous non-React HTML so nothing breaks.
  useEffect(() => {
    // No-op: ensure component mounted before app.js runs (script order in index.html handles this).
  }, []);

  return (
    <>
      <header>
        <h2>Панель инструментов</h2>
        <div className="panel">
          <label htmlFor="ticker">Тикер:</label>
          <input id="ticker" placeholder="например, CNYRUBF" defaultValue="CNYRUBF" />
          <button id="load">Загрузить</button>
          <span id="status" className="muted"></span>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h3 id="title">Инструмент</h3>
          <div id="summary"></div>
        </div>
        <div id="underlyingCard" className="card" style={{ height: 'auto', display: 'none' }}>
          <h3 id="underlyingTitle">Базовый актив</h3>
          <div id="underlyingSummary"></div>
        </div>
        <div className="card">
          <div id="positions" className="muted">Загрузка...</div>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="panel" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 id="chartTitle">Свечи (1m, сегодня)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <label htmlFor="scale" className="muted">Масштаб:</label>
                <select id="scale" defaultValue="1m">
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                </select>
              </div>
            </div>
          </div>
          <div id="chart"></div>
        </div>
      </section>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
