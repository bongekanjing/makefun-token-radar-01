// Token Radar's dashboard. It reads window.RADAR (written beside dashboard/
// by main.ts) and renders the ranked board, the filters, a per-protocol
// detail view with the model's own arithmetic, and the live-token table.
// No network: every byte it shows is in data.js. No framework.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;

  var rows = DATA.rows || [];
  var live = DATA.live || [];
  var FLOOR = DATA.floor_usd || 50000000;

  var $ = function (id) { return document.getElementById(id); };
  var qEl = $('q'), catEl = $('category'), chainEl = $('chain'), setEl = $('set'), sortEl = $('sort');
  var rowsEl = $('rows'), countEl = $('count'), emptyEl = $('empty'), detailEl = $('detail');
  var selectedSlug = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }
  // A row is on the watchlist when the snapshot's watchlist named its slug;
  // main.ts writes that flag into each row as `on_watchlist`.
  function onWatchlist(r) {
    if (typeof r.on_watchlist === 'boolean') return r.on_watchlist;
    return r.tvl_usd >= FLOOR;
  }

  // ---- headline ----
  var totalTvl = rows.reduce(function (s, r) { return s + r.tvl_usd; }, 0);
  var top = rows.length ? rows[0].implied_value_usd : 0;
  var median = rows.length ? rows[Math.floor(rows.length / 2)].implied_value_usd : 0;
  $('headline').innerHTML =
    '<div><dt>Protocols ranked</dt><dd>' + rows.length + '</dd></div>' +
    '<div><dt>Watchlist covered</dt><dd>' + DATA.watchlist_size + ' / ' + DATA.watchlist_size + '</dd></div>' +
    '<div><dt>Top implied value</dt><dd>' + fmtUsd(top) + '</dd></div>' +
    '<div><dt>Median implied value</dt><dd>' + fmtUsd(median) + '</dd></div>' +
    '<div><dt>Board TVL</dt><dd>' + fmtUsd(totalTvl) + '</dd></div>' +
    '<div><dt>Snapshot as of</dt><dd>' + esc(DATA.as_of) + '</dd></div>';
  $('asof').textContent = DATA.as_of;
  $('modelver').textContent = DATA.model_version;

  // ---- filter options ----
  var cats = {}, chains = {};
  rows.forEach(function (r) {
    if (r.category) cats[r.category] = true;
    (r.chains || []).forEach(function (c) { chains[c] = true; });
  });
  Object.keys(cats).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; catEl.appendChild(o);
  });
  Object.keys(chains).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; chainEl.appendChild(o);
  });

  // ---- filtering + sorting ----
  function filtered() {
    var q = (qEl.value || '').trim().toLowerCase();
    var cat = catEl.value, ch = chainEl.value, set = setEl.value;
    var out = rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      if (cat && r.category !== cat) return false;
      if (ch && (r.chains || []).indexOf(ch) < 0) return false;
      if (set === 'watchlist' && !onWatchlist(r)) return false;
      if (set === 'early' && onWatchlist(r)) return false;
      return true;
    });
    var sort = sortEl.value;
    out.sort(function (a, b) {
      if (sort === 'tvl') return b.tvl_usd - a.tvl_usd;
      if (sort === 'growth') return (b.change_7d || 0) - (a.change_7d || 0);
      if (sort === 'age') return (b.age_days || 0) - (a.age_days || 0);
      if (sort === 'name') return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      return a.rank - b.rank;
    });
    return out;
  }

  function renderBoard() {
    var list = filtered();
    countEl.textContent = list.length + ' of ' + rows.length + ' protocols';
    emptyEl.hidden = list.length > 0;
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var pct = top > 0 ? Math.max(2, Math.round((r.implied_value_usd / top) * 100)) : 0;
      var chg = r.change_7d;
      var chgCls = chg === null ? '' : chg >= 0 ? 'pos' : 'neg';
      html += '<tr data-slug="' + esc(r.slug) + '"' + (r.slug === selectedSlug ? ' class="selected"' : '') + '>' +
        '<td class="num rank">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span> <span class="slug">' + esc(r.slug) + '</span>' +
        (onWatchlist(r)
          ? '<span class="badge watch">WATCHLIST</span>'
          : '<span class="badge early">EARLY FIND</span>') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc((r.chains || []).slice(0, 3).join(', ') || '—') + ((r.chains || []).length > 3 ? ' +' + ((r.chains || []).length - 3) : '') + '</td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + chgCls + '">' + fmtPct(chg) + '</td>' +
        '<td class="num">' + fmtAge(r.age_days) + '</td>' +
        '<td class="num"><strong>' + fmtUsd(r.implied_value_usd) + '</strong></td>' +
        '<td class="bar-col"><span class="bar" style="width:' + pct + '%"></span></td></tr>';
    }
    rowsEl.innerHTML = html;
  }

  // ---- detail view ----
  function showDetail(slug) {
    var r = null;
    for (var i = 0; i < rows.length; i++) if (rows[i].slug === slug) { r = rows[i]; break; }
    if (!r) { detailEl.hidden = true; detailEl.innerHTML = ''; selectedSlug = null; document.body.classList.remove('detail-mode'); renderBoard(); return; }
    selectedSlug = slug;
    var base = r.tvl_usd * r.category_multiple;
    var chg = r.change_7d;
    detailEl.innerHTML =
      '<button class="close" type="button" id="detail-close">Close</button>' +
      '<h2>' + esc(r.name) + ' <span class="slug">#' + r.rank + ' &middot; ' + esc(r.slug) + '</span></h2>' +
      '<p class="meta"><span>Category <b>' + esc(r.category || 'not recorded') + '</b></span>' +
      '<span>Chains <b>' + esc((r.chains || []).join(', ') || 'not recorded') + '</b></span>' +
      '<span>TVL <b>' + fmtUsd(r.tvl_usd) + '</b></span>' +
      '<span>7-day change <b>' + fmtPct(chg) + '</b></span>' +
      '<span>Tracked since <b>' + esc(r.listed_at || 'unknown') + '</b> (' + fmtAge(r.age_days) + ')</span>' +
      '<span>Token <b>records no token</b></span></p>' +
      '<table class="math"><thead><tr><th>Model step</th><th>Input</th><th class="num">Factor</th><th class="num">Value</th></tr></thead><tbody>' +
      '<tr><td>Base</td><td>TVL &times; category multiple ' + r.category_multiple.toFixed(2) + '</td><td class="num">' + r.category_multiple.toFixed(2) + '&times;</td><td class="num">' + fmtUsd(base) + '</td></tr>' +
      '<tr><td>Growth</td><td>7-day change ' + fmtPct(chg) + '</td><td class="num">' + r.growth_multiplier.toFixed(2) + '&times;</td><td class="num">' + fmtUsd(base * r.growth_multiplier) + '</td></tr>' +
      '<tr><td>Maturity</td><td>' + fmtAge(r.age_days) + ' with no token</td><td class="num">' + r.maturity_multiplier.toFixed(2) + '&times;</td><td class="num">' + fmtUsd(base * r.growth_multiplier * r.maturity_multiplier) + '</td></tr>' +
      '<tr><td>Breadth</td><td>' + (r.chains || []).length + ' chain' + ((r.chains || []).length === 1 ? '' : 's') + '</td><td class="num">' + r.breadth_multiplier.toFixed(2) + '&times;</td><td class="num">' + fmtUsd(base * r.growth_multiplier * r.maturity_multiplier * r.breadth_multiplier) + '</td></tr>' +
      '<tr class="total"><td>Implied value</td><td>The radar&rsquo;s own claim for this protocol</td><td class="num">&mdash;</td><td class="num">' + fmtUsd(r.implied_value_usd) + '</td></tr>' +
      '</tbody></table>' +
      '<h3>How to farm ' + esc(r.name) + '</h3>' +
      '<ol>' + (r.farm_steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="model-note">This is not a prediction that ' + esc(r.name) + ' will issue a token. It records no token in the snapshot; that is the record, not proof it has none.</p>';
    detailEl.hidden = false;
    $('detail-close').addEventListener('click', function () { showDetail(null); });
    renderBoard();
    // In the deep-linked detail view the panel already sits below the
    // header; scrolling would cut the header off the screenshot. In the
    // normal view, bring the panel into sight after a row click.
    if (!document.body.classList.contains('detail-mode')) detailEl.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }

  rowsEl.addEventListener('click', function (ev) {
    var tr = ev.target.closest ? ev.target.closest('tr[data-slug]') : null;
    if (tr) showDetail(tr.getAttribute('data-slug'));
  });

  // ---- live-token table ----
  $('live-rows').innerHTML = live.map(function (p) {
    var chg = p.change_7d;
    return '<tr><td><span class="name">' + esc(p.name) + '</span> <span class="slug">' + esc(p.slug) + '</span></td>' +
      '<td>' + esc(p.category || '—') + '</td>' +
      '<td>' + esc((p.chains || []).slice(0, 3).join(', ') || '—') + '</td>' +
      '<td class="num">' + fmtUsd(p.tvl_usd) + '</td>' +
      '<td class="num"><strong>' + fmtUsd(p.mcap_usd) + '</strong></td>' +
      '<td class="num ' + (chg === null ? '' : chg >= 0 ? 'pos' : 'neg') + '">' + fmtPct(chg) + '</td></tr>';
  }).join('');

  // ---- controls + deep links ----
  [qEl, catEl, chainEl, setEl, sortEl].forEach(function (el) {
    el.addEventListener('input', function () { renderBoard(); });
    el.addEventListener('change', function () { renderBoard(); });
  });

  function applyHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (h.indexOf('detail=') === 0) {
      var slug = decodeURIComponent(h.slice(7));
      document.body.classList.add('detail-mode');
      renderBoard();
      showDetail(slug);
      return;
    }
    document.body.classList.remove('detail-mode');
    if (h.indexOf('filter=') === 0) {
      var parts = decodeURIComponent(h.slice(7)).split(':');
      if (parts[0] === 'category' && parts[1]) catEl.value = parts[1];
      if (parts[0] === 'chain' && parts[1]) chainEl.value = parts[1];
      if (parts[0] === 'set' && parts[1]) setEl.value = parts[1];
    }
    renderBoard();
  }
  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
