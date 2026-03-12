// ==UserScript==
// @name         Pokémon Showdown Teambuilder Beautify
// @namespace    https://github.com/teambuilder-beautify
// @version      1.0.0
// @description  Adds a beautiful teamsheet overlay to the Pokémon Showdown teambuilder
// @author       Teambuilder Beautify
// @match        https://play.pokemonshowdown.com/*
// @match        http://play.pokemonshowdown.com/*
// @match        https://pokemonshowdown.com/*
// @match        http://pokemonshowdown.com/*
// @match        http://*.psim.us/*
// @match        https://*.psim.us/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const pageWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  // ============================================================
  // Type Colors
  // ============================================================

  const TYPE_COLORS = {
    Normal:   { bg: '#A8A878', text: '#fff' },
    Fire:     { bg: '#F08030', text: '#fff' },
    Water:    { bg: '#6890F0', text: '#fff' },
    Electric: { bg: '#F8D030', text: '#333' },
    Grass:    { bg: '#78C850', text: '#fff' },
    Ice:      { bg: '#98D8D8', text: '#333' },
    Fighting: { bg: '#C03028', text: '#fff' },
    Poison:   { bg: '#A040A0', text: '#fff' },
    Ground:   { bg: '#E0C068', text: '#333' },
    Flying:   { bg: '#A890F0', text: '#fff' },
    Psychic:  { bg: '#F85888', text: '#fff' },
    Bug:      { bg: '#A8B820', text: '#fff' },
    Rock:     { bg: '#B8A038', text: '#fff' },
    Ghost:    { bg: '#705898', text: '#fff' },
    Dragon:   { bg: '#7038F8', text: '#fff' },
    Dark:     { bg: '#705848', text: '#fff' },
    Steel:    { bg: '#B8B8D0', text: '#333' },
    Fairy:    { bg: '#EE99AC', text: '#333' },
    Stellar:  { bg: '#40B5A0', text: '#fff' },
    '???':    { bg: '#68A090', text: '#fff' },
  };

  // Fallback for unknown types
  function getTypeColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS['???'];
  }

  // ============================================================
  // Sprite URL helpers
  // ============================================================

  function getSpriteURL(species) {
    if (!species) return '';
    const id = toID(species);
    return 'https://play.pokemonshowdown.com/sprites/gen5/' + id + '.png';
  }

  function getItemSpriteURL(item) {
    if (!item) return '';
    const id = toID(item);
    return 'https://play.pokemonshowdown.com/sprites/itemicons/' + id + '.png';
  }

  function toID(str) {
    return ('' + str).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // ============================================================
  // Team Data Extraction
  // ============================================================

  function getCurrentTeamSets() {
    try {
      const tb = pageWindow.app && pageWindow.app.rooms && pageWindow.app.rooms.teambuilder;
      if (!tb || !tb.curTeam) return null;
      const team = tb.curTeam;
      // Ensure team.team is unpacked
      if (typeof team.team === 'string' || !team.team) {
        if (pageWindow.Storage && pageWindow.Storage.unpackTeam) {
          team.team = pageWindow.Storage.unpackTeam(team.packedTeam || team.team);
        }
      }
      return team.team || null;
    } catch (e) {
      console.error('[Teambuilder Beautify] Error getting team:', e);
      return null;
    }
  }

  function getCurrentTeamName() {
    try {
      const tb = pageWindow.app.rooms.teambuilder;
      return (tb && tb.curTeam && tb.curTeam.name) || 'Team';
    } catch (e) {
      return 'Team';
    }
  }

  function getCurrentTeamFormat() {
    try {
      const tb = pageWindow.app.rooms.teambuilder;
      return (tb && tb.curTeam && tb.curTeam.format) || '';
    } catch (e) {
      return '';
    }
  }

  // ============================================================
  // Pokemon Data Helpers
  // ============================================================

  function getSpeciesData(species) {
    if (!species) return null;
    const dex = pageWindow.BattlePokedex;
    if (!dex) return null;
    const id = toID(species);
    return dex[id] || null;
  }

  function getTypesForSet(set) {
    // Check if tera type changes display - no, we show base types + tera
    const data = getSpeciesData(set.species);
    if (data && data.types) return data.types;
    return [];
  }

  function getDisplayName(set) {
    // Use the species name; if german-showdown is active it will have already
    // modified BattlePokedex entries or the DOM. We read from the data directly.
    const data = getSpeciesData(set.species);
    // Try to get a translated name if BattlePokedex has been patched
    if (data && data.name) return data.name;
    return set.species || '???';
  }

  function getMoveName(move) {
    if (!move) return '';
    const dex = pageWindow.BattleMovedex;
    if (dex) {
      const id = toID(move);
      const entry = dex[id];
      if (entry && entry.name) return entry.name;
    }
    return move;
  }

  function getMoveType(move) {
    if (!move) return 'Normal';
    const dex = pageWindow.BattleMovedex;
    if (dex) {
      const id = toID(move);
      const entry = dex[id];
      if (entry && entry.type) return entry.type;
    }
    return 'Normal';
  }

  function getAbilityName(ability) {
    if (!ability) return '';
    const dex = pageWindow.BattleAbilities;
    if (dex) {
      const id = toID(ability);
      const entry = dex[id];
      if (entry && entry.name) return entry.name;
    }
    return ability;
  }

  function getItemName(item) {
    if (!item) return '';
    const dex = pageWindow.BattleItems;
    if (dex) {
      const id = toID(item);
      const entry = dex[id];
      if (entry && entry.name) return entry.name;
    }
    return item;
  }

  function getNatureName(nature) {
    return nature || '';
  }

  function formatEVs(evs) {
    if (!evs) return '';
    // Use whatever stat names are currently active (respects german-showdown)
    const statNames = pageWindow.BattleStatNames || {
      hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'
    };
    const parts = [];
    if (evs.hp) parts.push(evs.hp + ' ' + statNames.hp);
    if (evs.atk) parts.push(evs.atk + ' ' + statNames.atk);
    if (evs.def) parts.push(evs.def + ' ' + statNames.def);
    if (evs.spa) parts.push(evs.spa + ' ' + statNames.spa);
    if (evs.spd) parts.push(evs.spd + ' ' + statNames.spd);
    if (evs.spe) parts.push(evs.spe + ' ' + statNames.spe);
    return parts.join(' / ');
  }

  function formatIVs(ivs) {
    if (!ivs) return '';
    const statNames = pageWindow.BattleStatNames || {
      hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'
    };
    const parts = [];
    if (ivs.hp !== undefined && ivs.hp !== 31) parts.push(ivs.hp + ' ' + statNames.hp);
    if (ivs.atk !== undefined && ivs.atk !== 31) parts.push(ivs.atk + ' ' + statNames.atk);
    if (ivs.def !== undefined && ivs.def !== 31) parts.push(ivs.def + ' ' + statNames.def);
    if (ivs.spa !== undefined && ivs.spa !== 31) parts.push(ivs.spa + ' ' + statNames.spa);
    if (ivs.spd !== undefined && ivs.spd !== 31) parts.push(ivs.spd + ' ' + statNames.spd);
    if (ivs.spe !== undefined && ivs.spe !== 31) parts.push(ivs.spe + ' ' + statNames.spe);
    return parts.join(' / ');
  }

  // ============================================================
  // Sprite helper using Showdown's Dex
  // ============================================================

  function getSpriteSrc(set) {
    try {
      if (pageWindow.Dex && pageWindow.Dex.getTeambuilderSprite) {
        // This returns a CSS background style string, parse out the URL
        const style = pageWindow.Dex.getTeambuilderSprite(set);
        const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (match) return match[1];
      }
    } catch (e) { /* fall through */ }
    return getSpriteURL(set.species);
  }

  function getPokemonIconStyle(set) {
    try {
      if (pageWindow.Dex && pageWindow.Dex.getPokemonIcon) {
        const data = getSpeciesData(set.species);
        return pageWindow.Dex.getPokemonIcon(data || set.species);
      }
    } catch (e) { /* fall through */ }
    return '';
  }

  // ============================================================
  // Type icon URL from Showdown
  // ============================================================

  function getTypeIconURL(type) {
    return 'https://play.pokemonshowdown.com/sprites/types/' + type + '.png';
  }

  // ============================================================
  // CSS Styles
  // ============================================================

  const OVERLAY_CSS = `
    /* Overlay backdrop */
    .tb-beautify-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
      animation: tb-fadeIn 0.2s ease;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    @keyframes tb-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes tb-slideUp {
      from { transform: translateY(20px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    /* Modal container */
    .tb-beautify-modal {
      background: linear-gradient(145deg, #e8ecf1 0%, #dde3ea 100%);
      border-radius: 18px;
      padding: 26px;
      max-width: 1120px;
      width: 95vw;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 25px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1);
      animation: tb-slideUp 0.3s ease;
      position: relative;
    }
    .tb-beautify-modal::-webkit-scrollbar { width: 6px; }
    .tb-beautify-modal::-webkit-scrollbar-track { background: transparent; }
    .tb-beautify-modal::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }

    /* Header */
    .tb-beautify-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 2px solid rgba(0,0,0,0.08);
    }
    .tb-beautify-header h2 {
      color: #2c3e50;
      font-size: 20px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.2px;
    }
    .tb-beautify-header-format {
      color: #7f8c9b;
      font-size: 12px;
      margin-top: 2px;
      font-weight: 500;
    }
    .tb-beautify-close {
      background: rgba(0,0,0,0.06);
      border: none;
      color: #555;
      width: 34px; height: 34px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .tb-beautify-close:hover { background: rgba(0,0,0,0.12); color: #222; }

    /* Grid */
    .tb-beautify-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    @media (max-width: 780px) {
      .tb-beautify-grid { grid-template-columns: 1fr; }
    }
    @media (min-width: 1200px) {
      .tb-beautify-grid { grid-template-columns: repeat(3, 1fr); }
    }

    /* ===== Pokemon Card ===== */
    .tb-card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tb-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
    }

    /* Card header - type colored */
    .tb-card-header {
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 40px;
    }
    .tb-card-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    .tb-card-name {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.35);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tb-card-nickname {
      font-size: 10px;
      color: rgba(255,255,255,0.75);
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0;
    }
    .tb-card-header-types {
      display: flex;
      gap: 3px;
      flex-shrink: 0;
    }
    .tb-card-header-types img { height: 14px; }

    /* Card body - two columns */
    .tb-card-body {
      display: flex;
      padding: 10px 12px 12px;
      gap: 10px;
    }

    /* Sprite column */
    .tb-card-sprite-col {
      flex-shrink: 0;
      width: 84px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .tb-card-sprite {
      width: 80px; height: 80px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      image-rendering: auto;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }
    .tb-card-item-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      background: #f0f2f5;
      border-radius: 6px;
      padding: 3px 7px 3px 2px;
      max-width: 84px;
    }
    .tb-card-item-icon {
      width: 24px; height: 24px;
      image-rendering: pixelated;
      flex-shrink: 0;
    }
    .tb-card-item-name {
      font-size: 10px;
      color: #555;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Info column */
    .tb-card-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Info table rows */
    .tb-card-info-table {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    .tb-card-label {
      color: #8896a6;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 2px 0;
      white-space: nowrap;
    }
    .tb-card-value {
      color: #2c3e50;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Tera type badge */
    .tb-tera-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 7px 1px 2px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .tb-tera-badge img { height: 13px; }

    /* EVs/IVs */
    .tb-card-evs {
      font-size: 10.5px;
      color: #556677;
      font-weight: 500;
    }

    /* Moves grid */
    .tb-card-moves {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
      margin-top: 2px;
    }
    .tb-move-pill {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 4px 7px;
      border-radius: 5px;
      font-size: 10.5px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.25);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: filter 0.15s;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .tb-move-pill:hover { filter: brightness(1.1); }

    /* ===== Teamsheet button in Showdown ===== */
    .tb-beautify-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff !important;
      border: none;
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-left: 5px;
      vertical-align: middle;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      letter-spacing: 0.3px;
    }
    .tb-beautify-btn:hover {
      filter: brightness(1.12);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
    }
    .tb-beautify-btn:active { transform: translateY(0); }
    .tb-beautify-btn svg { width: 14px; height: 14px; }

    /* Footer */
    .tb-beautify-footer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 2px solid rgba(0,0,0,0.06);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .tb-beautify-footer-btn {
      background: #fff;
      color: #555;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 8px;
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tb-beautify-footer-btn:hover { background: #f5f5f5; color: #333; }
    .tb-beautify-footer-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border-color: transparent;
    }
    .tb-beautify-footer-btn.primary:hover { filter: brightness(1.1); }
  `;

  // ============================================================
  // Inject CSS
  // ============================================================

  function injectCSS() {
    if (document.getElementById('tb-beautify-css')) return;
    const style = document.createElement('style');
    style.id = 'tb-beautify-css';
    style.textContent = OVERLAY_CSS;
    document.head.appendChild(style);
  }

  // ============================================================
  // Render a single Pokemon card
  // ============================================================

  function renderCard(set) {
    const types = getTypesForSet(set);
    const primaryType = types[0] || 'Normal';
    const typeColor = getTypeColor(primaryType);
    const secondaryType = types[1] ? getTypeColor(types[1]) : null;

    // Build gradient for header
    let headerBg;
    if (secondaryType) {
      headerBg = `linear-gradient(135deg, ${typeColor.bg} 0%, ${typeColor.bg} 50%, ${getTypeColor(types[1]).bg} 100%)`;
    } else {
      headerBg = `linear-gradient(135deg, ${typeColor.bg}, ${typeColor.bg}dd)`;
    }

    const displayName = getDisplayName(set);
    const nickname = set.name && set.name !== set.species ? set.name : '';
    const abilityName = getAbilityName(set.ability);
    const itemName = getItemName(set.item);
    const natureName = getNatureName(set.nature);
    const evStr = formatEVs(set.evs);
    const ivStr = formatIVs(set.ivs);
    const teraType = set.teraType || '';

    // Sprite
    const spriteSrc = getSpriteSrc(set);

    // Type icons HTML
    const typeIconsHTML = types.map(t =>
      `<img src="${getTypeIconURL(t)}" alt="${t}" title="${t}">`
    ).join('');

    // Moves HTML
    const movesHTML = (set.moves || []).filter(Boolean).map(move => {
      const moveName = getMoveName(move);
      const moveType = getMoveType(move);
      const tc = getTypeColor(moveType);
      return `<div class="tb-move-pill" style="background: ${tc.bg}; color: ${tc.text};" title="${moveName}">
        <span class="tb-move-type-dot" style="background: rgba(255,255,255,0.3);"></span>
        ${escapeHTML(moveName)}
      </div>`;
    }).join('');

    // Item icon
    const itemIconHTML = set.item
      ? `<img class="tb-card-item-icon" src="${getItemSpriteURL(set.item)}" alt="" onerror="this.style.display='none'">`
      : '';

    // Tera badge
    let teraBadgeHTML = '';
    if (teraType) {
      const teraColor = getTypeColor(teraType);
      teraBadgeHTML = `<span class="tb-tera-badge" style="background: ${teraColor.bg}; color: ${teraColor.text};">
        <img src="${getTypeIconURL(teraType)}" alt="${teraType}"> ${escapeHTML(teraType)}
      </span>`;
    }

    return `
      <div class="tb-card">
        <div class="tb-card-header" style="background: ${headerBg};">
          <div class="tb-card-header-left">
            <span class="tb-card-name">
              ${escapeHTML(displayName)}
              ${nickname ? ` <span class="tb-card-nickname">(${escapeHTML(nickname)})</span>` : ''}
            </span>
          </div>
          <div class="tb-card-header-types">
            ${typeIconsHTML}
          </div>
        </div>
        <div class="tb-card-body">
          <div class="tb-card-sprite-col">
            <div class="tb-card-sprite" style="background-image: url('${spriteSrc}');"></div>
            ${itemName ? `<div class="tb-card-item-badge">
              ${itemIconHTML}
              <span class="tb-card-item-name">${escapeHTML(itemName)}</span>
            </div>` : ''}
          </div>
          <div class="tb-card-info">
            <div class="tb-card-info-table">
              <span class="tb-card-label">Ability</span>
              <span class="tb-card-value">${escapeHTML(abilityName)}</span>
              ${teraType ? `
                <span class="tb-card-label">Tera</span>
                <span class="tb-card-value">${teraBadgeHTML}</span>
              ` : ''}
              <span class="tb-card-label">Nature</span>
              <span class="tb-card-value">${escapeHTML(natureName)}</span>
              ${evStr ? `
                <span class="tb-card-label">EVs</span>
                <span class="tb-card-evs">${escapeHTML(evStr)}</span>
              ` : ''}
              ${ivStr ? `
                <span class="tb-card-label">IVs</span>
                <span class="tb-card-evs">${escapeHTML(ivStr)}</span>
              ` : ''}
            </div>
            <div class="tb-card-moves">
              ${movesHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // Render the full overlay
  // ============================================================

  function showTeamsheet() {
    const sets = getCurrentTeamSets();
    if (!sets || sets.length === 0) {
      alert('No team data found. Please select a team in the teambuilder first.');
      return;
    }

    // Remove existing overlay if any
    closeTeamsheet();

    const teamName = getCurrentTeamName();
    const format = getCurrentTeamFormat();

    const cardsHTML = sets.map(set => renderCard(set)).join('');

    const overlay = document.createElement('div');
    overlay.className = 'tb-beautify-overlay';
    overlay.innerHTML = `
      <div class="tb-beautify-modal">
        <div class="tb-beautify-header">
          <div>
            <h2>${escapeHTML(teamName)}</h2>
            ${format ? `<div class="tb-beautify-header-format">${escapeHTML(format)}</div>` : ''}
          </div>
          <button class="tb-beautify-close" title="Close">&times;</button>
        </div>
        <div class="tb-beautify-grid">
          ${cardsHTML}
        </div>
        <div class="tb-beautify-footer">
          <button class="tb-beautify-footer-btn" data-action="export-image">
            📋 Copy as Image
          </button>
          <button class="tb-beautify-footer-btn primary" data-action="close">
            Close
          </button>
        </div>
      </div>
    `;

    // Event handlers
    overlay.querySelector('.tb-beautify-close').addEventListener('click', closeTeamsheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeTeamsheet();
    });

    const exportBtn = overlay.querySelector('[data-action="export-image"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        exportTeamsheetAsImage(overlay.querySelector('.tb-beautify-modal'));
      });
    }

    const closeBtn = overlay.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeTeamsheet);
    }

    // Escape key
    overlay._keyHandler = function (e) {
      if (e.key === 'Escape') closeTeamsheet();
    };
    document.addEventListener('keydown', overlay._keyHandler);

    document.body.appendChild(overlay);
  }

  function closeTeamsheet() {
    const overlay = document.querySelector('.tb-beautify-overlay');
    if (overlay) {
      if (overlay._keyHandler) {
        document.removeEventListener('keydown', overlay._keyHandler);
      }
      overlay.remove();
    }
  }

  // ============================================================
  // Export as image (canvas-based screenshot)
  // ============================================================

  async function exportTeamsheetAsImage(modalEl) {
    // Try using html2canvas if available, otherwise fallback to clipboard text
    try {
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(modalEl, {
          backgroundColor: '#1a1a2e',
          scale: 2,
          useCORS: true,
        });
        canvas.toBlob(function(blob) {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
              showToast('Teamsheet copied to clipboard!');
            }).catch(() => {
              // Fallback: download
              downloadBlob(blob, 'teamsheet.png');
            });
          } else {
            downloadBlob(blob, 'teamsheet.png');
          }
        }, 'image/png');
        return;
      }
    } catch (e) {
      console.warn('[Teambuilder Beautify] html2canvas not available:', e);
    }

    // Fallback: copy team text to clipboard
    const sets = getCurrentTeamSets();
    if (sets && pageWindow.Storage && pageWindow.Storage.exportTeam) {
      const text = pageWindow.Storage.exportTeam(sets);
      navigator.clipboard.writeText(text).then(() => {
        showToast('Team text copied to clipboard! (Install html2canvas for image export)');
      });
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 12px 24px; border-radius: 8px;
      font-size: 14px; z-index: 200000; animation: tb-fadeIn 0.2s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ============================================================
  // Inject Teamsheet button into teambuilder
  // ============================================================

  function injectButton() {
    // Look for teambuilder rooms (Showdown can have multiple room types)
    const rooms = document.querySelectorAll('[id^="room-teambuilder"]');
    if (!rooms.length) return;

    for (const room of rooms) {
      // Don't re-inject
      if (room.querySelector('.tb-beautify-btn')) continue;

      // The team chart view has a button[name="import"] for Import/Export
      const importBtn = room.querySelector('button[name="import"]');
      if (!importBtn) continue;

      // Insert our button next to the Import/Export button
      const btn = document.createElement('button');
      btn.className = 'tb-beautify-btn';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        </svg>
        Teamsheet
      `;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showTeamsheet();
      });

      importBtn.parentElement.insertBefore(btn, importBtn.nextSibling);
    }
  }

  // ============================================================
  // Utility
  // ============================================================

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // Initialization
  // ============================================================

  function init() {
    injectCSS();

    // Periodically check if we need to inject the button
    setInterval(function () {
      try {
        injectButton();
      } catch (e) {
        // Silently ignore
      }
    }, 1000);

    console.log('[Teambuilder Beautify] Loaded successfully!');
  }

  // Wait for Showdown to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 500);
    });
  }
})();
