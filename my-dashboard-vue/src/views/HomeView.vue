<template>
  <main class="page-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark">FF</div>
        <div>
          <div class="eyebrow">FastForward Logistics</div>
          <h1>Ops Dashboard</h1>
        </div>
      </div>

      <div class="filter-row">
        <button type="button" class="filter-chip active">Last 30 days</button>
        <select aria-label="Region filter">
          <option>All Regions</option>
          <option>Northeast</option>
          <option>Southeast</option>
        </select>
        <select aria-label="Carrier filter">
          <option>All Carriers</option>
          <option>Apex Freight Solutions</option>
          <option>BlueLine Transport</option>
        </select>
        <select aria-label="Status filter">
          <option>All Shipment Status</option>
          <option>In Transit</option>
          <option>Delivered</option>
          <option>Delayed</option>
        </select>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <div class="card-label">Total Shipments</div>
        <div class="card-value">1,284</div>
        <div class="card-trend positive">↗ 8.2% vs prior period</div>
      </article>
      <article class="summary-card">
        <div class="card-label">Network On-Time Rate</div>
        <div class="card-value good">87.4%</div>
        <div class="card-trend positive">↗ 2.8% vs prior period</div>
      </article>
      <article class="summary-card">
        <div class="card-label">Open Exceptions</div>
        <div class="card-value alert">47</div>
        <div class="card-trend negative">↘ 4.1% vs prior period</div>
      </article>
      <article class="summary-card">
        <div class="card-label">Avg Cost vs. Contract</div>
        <div class="card-value bad">+4.2%</div>
        <div class="card-trend negative">↘ 1.4% vs prior period</div>
      </article>
    </section>

    <section class="primary-grid">
      <div class="panel table-panel">
        <div class="panel-header">
          <h2>Carrier Performance Scorecard</h2>
          <span class="panel-tag">Last 30 days</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Carrier</th>
              <th>Shipments</th>
              <th>On-Time</th>
              <th>Exception</th>
              <th>Cost vs. Contract</th>
              <th>Composite</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>FrontLine Carriers</td>
              <td>251</td>
              <td><span class="status-pill good">95.1%</span></td>
              <td><span class="status-pill good">6.2%</span></td>
              <td><span class="status-pill good">-1.9%</span></td>
              <td><span class="score-badge excellent">92.8</span></td>
              <td>▲</td>
            </tr>
            <tr>
              <td>2</td>
              <td>DeltaHaul Inc.</td>
              <td>232</td>
              <td><span class="status-pill good">92.6%</span></td>
              <td><span class="status-pill good">8.7%</span></td>
              <td><span class="status-pill good">-1.1%</span></td>
              <td><span class="score-badge good">88.4</span></td>
              <td>▲</td>
            </tr>
            <tr class="low-score">
              <td>6</td>
              <td>Evergreen Shipping Co.</td>
              <td>183</td>
              <td><span class="status-pill bad">79.3%</span></td>
              <td><span class="status-pill bad">18.6%</span></td>
              <td><span class="status-pill bad">+9.2%</span></td>
              <td><span class="score-badge alert">66.7</span></td>
              <td>▼</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel trend-panel">
        <div class="panel-header stacked-header">
          <h2>Exception Trend</h2>
          <div class="segmented-control">
            <button type="button" class="selected">By Exception Type</button>
            <button type="button">By Carrier</button>
          </div>
        </div>

        <div class="segmented-control metric-toggle">
          <button type="button" class="selected">Count</button>
          <button type="button">% of Shipments</button>
        </div>

        <div class="bar-chart">
          <div class="bar-group">
            <div class="stacked-bars">
              <span class="bar late" style="height: 58%" />
              <span class="bar docs" style="height: 32%" />
              <span class="bar invoice" style="height: 18%" />
            </div>
            <label>W1</label>
          </div>
          <div class="bar-group">
            <div class="stacked-bars">
              <span class="bar late" style="height: 72%" />
              <span class="bar docs" style="height: 47%" />
              <span class="bar invoice" style="height: 24%" />
            </div>
            <label>W2</label>
          </div>
          <div class="bar-group">
            <div class="stacked-bars">
              <span class="bar late" style="height: 80%" />
              <span class="bar docs" style="height: 56%" />
              <span class="bar invoice" style="height: 36%" />
            </div>
            <label>W3</label>
          </div>
        </div>

        <div class="legend-row">
          <span><i class="dot late" />Late Delivery</span>
          <span><i class="dot docs" />Missing Documentation</span>
          <span><i class="dot invoice" />Invoice Discrepancy</span>
        </div>
      </div>
    </section>

    <section class="secondary-grid">
      <div class="panel volume-panel">
        <div class="panel-header">
          <h2>Shipment Volume</h2>
          <span class="panel-tag">Last 30 days</span>
        </div>

        <svg viewBox="0 0 360 140" class="volume-chart" aria-label="Shipment volume chart" role="img">
          <path d="M 18 100 L 52 88 L 86 85 L 120 70 L 154 78 L 188 62 L 222 66 L 256 59 L 290 48 L 324 54" class="volume-line total" />
          <path d="M 18 94 L 52 82 L 86 79 L 120 68 L 154 72 L 188 57 L 222 60 L 256 52 L 290 42 L 324 48" class="volume-line ontime" />
        </svg>

        <div class="chart-legend">
          <span><i class="line-swatch total" />Total Shipments</span>
          <span><i class="line-swatch ontime" />On-Time Shipments</span>
        </div>
      </div>

      <div class="panel regional-panel">
        <div class="panel-header">
          <h2>Regional Performance</h2>
          <span class="panel-tag">Worst first</span>
        </div>

        <div class="regional-grid">
          <div class="region-card bad">
            <div class="region-name">Southeast</div>
            <div class="region-stat">312 shipments</div>
            <div class="region-rate bad">82.4%</div>
            <div class="region-open">18 open exceptions</div>
          </div>
          <div class="region-card warn">
            <div class="region-name">Midwest</div>
            <div class="region-stat">282 shipments</div>
            <div class="region-rate warn">86.1%</div>
            <div class="region-open">15 open exceptions</div>
          </div>
          <div class="region-card good">
            <div class="region-name">Northeast</div>
            <div class="region-stat">221 shipments</div>
            <div class="region-rate good">91.2%</div>
            <div class="region-open">9 open exceptions</div>
          </div>
          <div class="region-card good">
            <div class="region-name">West</div>
            <div class="region-stat">198 shipments</div>
            <div class="region-rate good">93.4%</div>
            <div class="region-open">7 open exceptions</div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel exceptions-panel">
      <div class="panel-header compact-header">
        <h2>Open Exceptions</h2>
        <div class="inline-filters">
          <select aria-label="Exception type filter">
            <option>All Types</option>
            <option>Late Delivery</option>
            <option>Missing Documentation</option>
            <option>Invoice Discrepancy</option>
          </select>
          <select aria-label="Carrier exception filter">
            <option>All Carriers</option>
            <option>Apex Freight Solutions</option>
            <option>BlueLine Transport</option>
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Exception ID</th>
            <th>Type</th>
            <th>Carrier</th>
            <th>Route</th>
            <th>Shipment #</th>
            <th>Date Opened</th>
            <th>Days Open</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EXC-00423</td>
            <td>Late Delivery</td>
            <td>Evergreen Shipping Co.</td>
            <td>Chicago, IL → Atlanta, GA</td>
            <td>SHP-10291</td>
            <td>Sep 07, 2026</td>
            <td><span class="danger-days">7</span></td>
            <td><span class="status-pill open">Open</span></td>
          </tr>
          <tr>
            <td>EXC-00419</td>
            <td>Missing Documentation</td>
            <td>Cardinal Logistics</td>
            <td>Dallas, TX → Houston, TX</td>
            <td>SHP-10248</td>
            <td>Sep 05, 2026</td>
            <td><span class="danger-days">9</span></td>
            <td><span class="status-pill review">In Review</span></td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup lang="ts">
</script>
