// ==UserScript==
// @name         Pokémon Showdown Teambuilder Beautify
// @namespace    https://github.com/teambuilder-beautify
// @version      1.1.0
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
  // Type Colors — vibrant palette with guaranteed white text
  // ============================================================

  const TYPE_COLORS = {
    Normal:   { bg: '#9099A1', light: '#c8ccd0' },
    Fire:     { bg: '#E8403F', light: '#f4a8a7' },
    Water:    { bg: '#3F93E8', light: '#a7cff4' },
    Electric: { bg: '#F5C740', light: '#fae6a0' },
    Grass:    { bg: '#3FAD5B', light: '#a0d8ad' },
    Ice:      { bg: '#4FD1C5', light: '#a8e8e2' },
    Fighting: { bg: '#CB5F48', light: '#e5afa4' },
    Poison:   { bg: '#AB6AC8', light: '#d5b5e4' },
    Ground:   { bg: '#D97746', light: '#ecbba3' },
    Flying:   { bg: '#8AABE0', light: '#c5d5f0' },
    Psychic:  { bg: '#E87080', light: '#f4b8c0' },
    Bug:      { bg: '#91BA2E', light: '#c8dd97' },
    Rock:     { bg: '#C5B68C', light: '#e2dbc6' },
    Ghost:    { bg: '#5269AC', light: '#a9b4d6' },
    Dragon:   { bg: '#0969C1', light: '#84b4e0' },
    Dark:     { bg: '#5A5366', light: '#ada9b3' },
    Steel:    { bg: '#598FA3', light: '#acc7d1' },
    Fairy:    { bg: '#E88CE8', light: '#f4c6f4' },
    Stellar:  { bg: '#40B5A0', light: '#a0dad0' },
    '???':    { bg: '#68A090', light: '#b4d0c8' },
  };

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
    const data = getSpeciesData(set.species);
    if (data && data.types) return data.types;
    return [];
  }

  function getDisplayName(set) {
    const data = getSpeciesData(set.species);
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
  // Sprite helpers using Showdown's Dex
  // ============================================================

  function getSpriteStyle(set) {
    try {
      if (pageWindow.Dex && pageWindow.Dex.getTeambuilderSprite) {
        return pageWindow.Dex.getTeambuilderSprite(set);
      }
    } catch (e) { /* fall through */ }
    return 'background-image:url(' + getSpriteURL(set.species) + ');background-size:contain;background-position:center;background-repeat:no-repeat';
  }

  function getItemIconStyle(item) {
    if (!item) return '';
    try {
      if (pageWindow.Dex && pageWindow.Dex.getItemIcon) {
        return pageWindow.Dex.getItemIcon(item);
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
      background: rgba(15, 15, 25, 0.75);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      animation: tb-fadeIn 0.25s ease;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
    }

    @keyframes tb-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes tb-slideUp {
      from { transform: translateY(30px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    /* Modal container */
    .tb-beautify-modal {
      background: #1a1d2e;
      border-radius: 20px;
      padding: 32px;
      max-width: 1300px;
      width: 96vw;
      max-height: 94vh;
      overflow-y: auto;
      box-shadow: 0 30px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
      animation: tb-slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .tb-beautify-modal::-webkit-scrollbar { width: 8px; }
    .tb-beautify-modal::-webkit-scrollbar-track { background: transparent; }
    .tb-beautify-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    .tb-beautify-modal::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

    /* Header */
    .tb-beautify-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .tb-beautify-header h2 {
      color: #f0f2f8;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .tb-beautify-header-format {
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      margin-top: 4px;
      font-weight: 500;
    }
    .tb-beautify-close {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5);
      width: 38px; height: 38px;
      border-radius: 10px;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .tb-beautify-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

    /* Grid — 2 columns with generous gap */
    .tb-beautify-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }
    @media (max-width: 860px) {
      .tb-beautify-grid { grid-template-columns: 1fr; }
    }
    @media (min-width: 1350px) {
      .tb-beautify-grid { grid-template-columns: repeat(3, 1fr); }
    }

    /* ===== Pokemon Card ===== */
    .tb-card {
      background: #242840;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tb-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    /* Card header — type colored bar */
    .tb-card-header {
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 52px;
      position: relative;
    }
    .tb-card-header-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .tb-card-name {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.4);
      letter-spacing: 0.3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tb-card-nickname {
      font-size: 12px;
      color: rgba(255,255,255,0.65);
      font-weight: 500;
    }
    .tb-card-header-types {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .tb-card-header-types img { height: 18px; }

    /* Card body — two columns */
    .tb-card-body {
      display: flex;
      padding: 16px 18px 18px;
      gap: 16px;
    }

    /* Sprite column */
    .tb-card-sprite-col {
      flex-shrink: 0;
      width: 110px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .tb-card-sprite-wrap {
      width: 110px;
      height: 110px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .tb-card-sprite {
      width: 110px;
      height: 110px;
      image-rendering: auto;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.3));
      background-size: 110px !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }

    /* Item badge using Showdown spritesheet */
    .tb-card-item-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 4px 10px 4px 0;
      max-width: 110px;
    }
    .tb-card-item-icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      flex-shrink: 0;
      image-rendering: pixelated;
    }
    .tb-card-item-name {
      font-size: 11px;
      color: rgba(255,255,255,0.7);
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
      gap: 4px;
    }

    /* Info rows */
    .tb-card-info-table {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 12px;
      align-items: center;
      margin-bottom: 10px;
    }
    .tb-card-label {
      color: rgba(255,255,255,0.35);
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 2px 0;
      white-space: nowrap;
    }
    .tb-card-value {
      color: rgba(255,255,255,0.9);
      font-size: 13px;
      font-weight: 600;
      padding: 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Tera type badge */
    .tb-tera-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 3px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }
    .tb-tera-badge img { height: 15px; }

    /* EVs/IVs */
    .tb-card-evs {
      font-size: 11.5px;
      color: rgba(255,255,255,0.55);
      font-weight: 500;
    }

    /* Moves grid */
    .tb-card-moves {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-top: 4px;
    }
    .tb-move-pill {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: filter 0.15s;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      border: none;
    }
    .tb-move-pill:hover { filter: brightness(1.15); }

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
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .tb-beautify-footer-btn {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tb-beautify-footer-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
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

    // Build gradient for header
    let headerBg;
    if (types[1]) {
      const tc2 = getTypeColor(types[1]);
      headerBg = 'linear-gradient(135deg, ' + typeColor.bg + ' 0%, ' + typeColor.bg + ' 45%, ' + tc2.bg + ' 100%)';
    } else {
      headerBg = 'linear-gradient(135deg, ' + typeColor.bg + ', ' + typeColor.bg + 'cc)';
    }

    // Sprite background tint from type
    const spriteBg = typeColor.light + '22';

    const displayName = getDisplayName(set);
    const nickname = set.name && set.name !== set.species ? set.name : '';
    const abilityName = getAbilityName(set.ability);
    const itemName = getItemName(set.item);
    const natureName = getNatureName(set.nature);
    const evStr = formatEVs(set.evs);
    const ivStr = formatIVs(set.ivs);
    const teraType = set.teraType || '';

    // Sprite style from Dex (CSS background properties)
    const spriteStyle = getSpriteStyle(set);

    // Type icons HTML
    const typeIconsHTML = types.map(function(t) {
      return '<img src="' + getTypeIconURL(t) + '" alt="' + t + '" title="' + t + '">';
    }).join('');

    // Moves HTML — all use white text
    const movesHTML = (set.moves || []).filter(Boolean).map(function(move) {
      const moveName = getMoveName(move);
      const moveType = getMoveType(move);
      const tc = getTypeColor(moveType);
      return '<div class="tb-move-pill" style="background: ' + tc.bg + ';" title="' + escapeHTML(moveName) + '">' +
        escapeHTML(moveName) +
      '</div>';
    }).join('');

    // Item icon using Showdown's spritesheet
    let itemIconHTML = '';
    if (set.item) {
      const itemStyle = getItemIconStyle(set.item);
      if (itemStyle) {
        itemIconHTML = '<span class="tb-card-item-icon" style="' + itemStyle + '"></span>';
      }
    }

    // Tera badge
    let teraBadgeHTML = '';
    if (teraType) {
      const teraColor = getTypeColor(teraType);
      teraBadgeHTML = '<span class="tb-tera-badge" style="background: ' + teraColor.bg + ';">' +
        '<img src="' + getTypeIconURL(teraType) + '" alt="' + escapeHTML(teraType) + '"> ' + escapeHTML(teraType) +
      '</span>';
    }

    return '' +
      '<div class="tb-card">' +
        '<div class="tb-card-header" style="background: ' + headerBg + ';">' +
          '<div class="tb-card-header-left">' +
            '<span class="tb-card-name">' + escapeHTML(displayName) + '</span>' +
            (nickname ? '<span class="tb-card-nickname">' + escapeHTML(nickname) + '</span>' : '') +
          '</div>' +
          '<div class="tb-card-header-types">' +
            typeIconsHTML +
          '</div>' +
        '</div>' +
        '<div class="tb-card-body">' +
          '<div class="tb-card-sprite-col">' +
            '<div class="tb-card-sprite-wrap" style="background: ' + spriteBg + ';">' +
              '<div class="tb-card-sprite" style="' + spriteStyle + '"></div>' +
            '</div>' +
            (itemName ? '<div class="tb-card-item-badge">' +
              itemIconHTML +
              '<span class="tb-card-item-name">' + escapeHTML(itemName) + '</span>' +
            '</div>' : '') +
          '</div>' +
          '<div class="tb-card-info">' +
            '<div class="tb-card-info-table">' +
              '<span class="tb-card-label">Ability</span>' +
              '<span class="tb-card-value">' + escapeHTML(abilityName) + '</span>' +
              (teraType ?
                '<span class="tb-card-label">Tera</span>' +
                '<span class="tb-card-value">' + teraBadgeHTML + '</span>'
              : '') +
              '<span class="tb-card-label">Nature</span>' +
              '<span class="tb-card-value">' + escapeHTML(natureName) + '</span>' +
              (evStr ?
                '<span class="tb-card-label">EVs</span>' +
                '<span class="tb-card-evs">' + escapeHTML(evStr) + '</span>'
              : '') +
              (ivStr ?
                '<span class="tb-card-label">IVs</span>' +
                '<span class="tb-card-evs">' + escapeHTML(ivStr) + '</span>'
              : '') +
            '</div>' +
            '<div class="tb-card-moves">' +
              movesHTML +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
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

    closeTeamsheet();

    const teamName = getCurrentTeamName();
    const format = getCurrentTeamFormat();

    const cardsHTML = sets.map(function(set) { return renderCard(set); }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'tb-beautify-overlay';
    overlay.innerHTML = '' +
      '<div class="tb-beautify-modal">' +
        '<div class="tb-beautify-header">' +
          '<div>' +
            '<h2>' + escapeHTML(teamName) + '</h2>' +
            (format ? '<div class="tb-beautify-header-format">' + escapeHTML(format) + '</div>' : '') +
          '</div>' +
          '<button class="tb-beautify-close" title="Close">&times;</button>' +
        '</div>' +
        '<div class="tb-beautify-grid">' +
          cardsHTML +
        '</div>' +
        '<div class="tb-beautify-footer">' +
          '<button class="tb-beautify-footer-btn" data-action="export-image">Copy as Image</button>' +
          '<button class="tb-beautify-footer-btn primary" data-action="close">Close</button>' +
        '</div>' +
      '</div>';

    // Event handlers
    overlay.querySelector('.tb-beautify-close').addEventListener('click', closeTeamsheet);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeTeamsheet();
    });

    var exportBtn = overlay.querySelector('[data-action="export-image"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        exportTeamsheetAsImage(overlay.querySelector('.tb-beautify-modal'));
      });
    }

    var closeBtn = overlay.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeTeamsheet);
    }

    overlay._keyHandler = function (e) {
      if (e.key === 'Escape') closeTeamsheet();
    };
    document.addEventListener('keydown', overlay._keyHandler);

    document.body.appendChild(overlay);
  }

  function closeTeamsheet() {
    var overlay = document.querySelector('.tb-beautify-overlay');
    if (overlay) {
      if (overlay._keyHandler) {
        document.removeEventListener('keydown', overlay._keyHandler);
      }
      overlay.remove();
    }
  }

  // ============================================================
  // Export as image
  // ============================================================

  async function exportTeamsheetAsImage(modalEl) {
    try {
      if (typeof html2canvas !== 'undefined') {
        var canvas = await html2canvas(modalEl, {
          backgroundColor: '#1a1d2e',
          scale: 2,
          useCORS: true,
        });
        canvas.toBlob(function(blob) {
          if (blob && navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(function() {
              showToast('Teamsheet copied to clipboard!');
            }).catch(function() {
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

    var sets = getCurrentTeamSets();
    if (sets && pageWindow.Storage && pageWindow.Storage.exportTeam) {
      var text = pageWindow.Storage.exportTeam(sets);
      navigator.clipboard.writeText(text).then(function() {
        showToast('Team text copied to clipboard! (Install html2canvas for image export)');
      });
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
      'background:rgba(30,33,50,0.95);color:#fff;padding:14px 28px;border-radius:12px;' +
      'font-size:14px;z-index:200000;animation:tb-fadeIn 0.2s ease;' +
      'box-shadow:0 8px 30px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);' +
      'font-weight:600;backdrop-filter:blur(10px);';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  }

  // ============================================================
  // Inject Teamsheet button into teambuilder
  // ============================================================

  function injectButton() {
    var rooms = document.querySelectorAll('[id^="room-teambuilder"]');
    if (!rooms.length) return;

    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      if (room.querySelector('.tb-beautify-btn')) continue;

      var importBtn = room.querySelector('button[name="import"]');
      if (!importBtn) continue;

      var btn = document.createElement('button');
      btn.className = 'tb-beautify-btn';
      btn.innerHTML = '' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="3" width="7" height="7"></rect>' +
          '<rect x="14" y="3" width="7" height="7"></rect>' +
          '<rect x="3" y="14" width="7" height="7"></rect>' +
          '<rect x="14" y="14" width="7" height="7"></rect>' +
        '</svg>' +
        'Teamsheet';
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
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // Initialization
  // ============================================================

  function init() {
    injectCSS();

    setInterval(function () {
      try {
        injectButton();
      } catch (e) {
        // Silently ignore
      }
    }, 1000);

    console.log('[Teambuilder Beautify] Loaded successfully!');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 500);
    });
  }
})();
