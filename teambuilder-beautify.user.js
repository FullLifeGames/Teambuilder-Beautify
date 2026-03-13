// ==UserScript==
// @name         Pokémon Showdown Teambuilder Beautify
// @namespace    https://github.com/teambuilder-beautify
// @version      1.0.2
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
  // Type Colors — with text color for readability
  // ============================================================

  const TYPE_COLORS = {
    Normal:   { bg: '#9099A1', text: '#fff',  dark: '#6b737a' },
    Fire:     { bg: '#E8403F', text: '#fff',  dark: '#c4302f' },
    Water:    { bg: '#3F93E8', text: '#fff',  dark: '#2d72bf' },
    Electric: { bg: '#F5C740', text: '#523a00', dark: '#c9a030' },
    Grass:    { bg: '#3FAD5B', text: '#fff',  dark: '#2e8a45' },
    Ice:      { bg: '#4FD1C5', text: '#103330', dark: '#38a89e' },
    Fighting: { bg: '#CB5F48', text: '#fff',  dark: '#a84a36' },
    Poison:   { bg: '#AB6AC8', text: '#fff',  dark: '#8a4fa6' },
    Ground:   { bg: '#D97746', text: '#fff',  dark: '#b55f32' },
    Flying:   { bg: '#8AABE0', text: '#fff',  dark: '#6388c4' },
    Psychic:  { bg: '#E87080', text: '#fff',  dark: '#c4505e' },
    Bug:      { bg: '#91BA2E', text: '#fff',  dark: '#728f22' },
    Rock:     { bg: '#C5B68C', text: '#3d3520', dark: '#a89868' },
    Ghost:    { bg: '#5269AC', text: '#fff',  dark: '#3d4f8a' },
    Dragon:   { bg: '#0969C1', text: '#fff',  dark: '#05509a' },
    Dark:     { bg: '#5A5366', text: '#fff',  dark: '#413c4e' },
    Steel:    { bg: '#598FA3', text: '#fff',  dark: '#447080' },
    Fairy:    { bg: '#E88CE8', text: '#3d1040', dark: '#c66cc6' },
    Stellar:  { bg: '#40B5A0', text: '#fff',  dark: '#2e8a78' },
    '???':    { bg: '#68A090', text: '#fff',  dark: '#4e7e70' },
  };

  function getTypeColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS['???'];
  }

  // ============================================================
  // Helpers
  // ============================================================

  function toID(str) {
    return ('' + str).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function getSpriteURL(species) {
    if (!species) return '';
    return 'https://play.pokemonshowdown.com/sprites/gen5/' + toID(species) + '.png';
  }

  function getAnimatedSpriteURL(species) {
    if (!species) return '';
    return 'https://play.pokemonshowdown.com/sprites/gen5ani/' + toID(species) + '.gif';
  }

  // ============================================================
  // Team Data Extraction
  // ============================================================

  function getCurrentTeamSets() {
    try {
      var tb = pageWindow.app && pageWindow.app.rooms && pageWindow.app.rooms.teambuilder;
      if (!tb || !tb.curTeam) return null;
      var team = tb.curTeam;
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
      var tb = pageWindow.app.rooms.teambuilder;
      return (tb && tb.curTeam && tb.curTeam.name) || 'Team';
    } catch (e) { return 'Team'; }
  }

  function getCurrentTeamFormat() {
    try {
      var tb = pageWindow.app.rooms.teambuilder;
      return (tb && tb.curTeam && tb.curTeam.format) || '';
    } catch (e) { return ''; }
  }

  // ============================================================
  // Pokemon Data Helpers
  // ============================================================

  function getSpeciesData(species) {
    if (!species) return null;
    var dex = pageWindow.BattlePokedex;
    if (!dex) return null;
    return dex[toID(species)] || null;
  }

  function getTypesForSet(set) {
    var data = getSpeciesData(set.species);
    return (data && data.types) ? data.types : [];
  }

  function getDisplayName(set) {
    var data = getSpeciesData(set.species);
    return (data && data.name) ? data.name : (set.species || '???');
  }

  function getMoveName(move) {
    if (!move) return '';
    var dex = pageWindow.BattleMovedex;
    if (dex) { var e = dex[toID(move)]; if (e && e.name) return e.name; }
    return move;
  }

  function getMoveType(move) {
    if (!move) return 'Normal';
    var dex = pageWindow.BattleMovedex;
    if (dex) { var e = dex[toID(move)]; if (e && e.type) return e.type; }
    return 'Normal';
  }

  function getMoveCategory(move) {
    if (!move) return 'Status';
    var dex = pageWindow.BattleMovedex;
    if (dex) { var e = dex[toID(move)]; if (e && e.category) return e.category; }
    return 'Status';
  }

  function getMovePower(move) {
    if (!move) return 0;
    var dex = pageWindow.BattleMovedex;
    if (dex) { var e = dex[toID(move)]; if (e && e.basePower) return e.basePower; }
    return 0;
  }

  function getMoveAccuracy(move) {
    if (!move) return 0;
    var dex = pageWindow.BattleMovedex;
    if (dex) { var e = dex[toID(move)]; if (e) return e.accuracy; }
    return 0;
  }

  function getAbilityName(ability) {
    if (!ability) return '';
    var dex = pageWindow.BattleAbilities;
    if (dex) { var e = dex[toID(ability)]; if (e && e.name) return e.name; }
    return ability;
  }

  function getItemName(item) {
    if (!item) return '';
    var dex = pageWindow.BattleItems;
    if (dex) { var e = dex[toID(item)]; if (e && e.name) return e.name; }
    return item;
  }

  function formatEVs(evs) {
    if (!evs) return '';
    var sn = pageWindow.BattleStatNames || { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
    var p = [];
    if (evs.hp) p.push(evs.hp + ' ' + sn.hp);
    if (evs.atk) p.push(evs.atk + ' ' + sn.atk);
    if (evs.def) p.push(evs.def + ' ' + sn.def);
    if (evs.spa) p.push(evs.spa + ' ' + sn.spa);
    if (evs.spd) p.push(evs.spd + ' ' + sn.spd);
    if (evs.spe) p.push(evs.spe + ' ' + sn.spe);
    return p.join(' / ');
  }

  function formatIVs(ivs) {
    if (!ivs) return '';
    var sn = pageWindow.BattleStatNames || { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
    var p = [];
    if (ivs.hp !== undefined && ivs.hp !== 31) p.push(ivs.hp + ' ' + sn.hp);
    if (ivs.atk !== undefined && ivs.atk !== 31) p.push(ivs.atk + ' ' + sn.atk);
    if (ivs.def !== undefined && ivs.def !== 31) p.push(ivs.def + ' ' + sn.def);
    if (ivs.spa !== undefined && ivs.spa !== 31) p.push(ivs.spa + ' ' + sn.spa);
    if (ivs.spd !== undefined && ivs.spd !== 31) p.push(ivs.spd + ' ' + sn.spd);
    if (ivs.spe !== undefined && ivs.spe !== 31) p.push(ivs.spe + ' ' + sn.spe);
    return p.join(' / ');
  }

  function getBaseStats(species) {
    var data = getSpeciesData(species);
    if (data && data.baseStats) return data.baseStats;
    return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }

  // ============================================================
  // Sprite helpers
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
  // CSS Styles
  // ============================================================

  const OVERLAY_CSS = `
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

    @keyframes tb-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes tb-slideUp {
      from { transform: translateY(30px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes tb-spriteFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes tb-barGrow {
      from { width: 0; }
    }

    /* Modal */
    .tb-beautify-modal {
      background: #1a1d2e;
      border-radius: 20px;
      padding: 32px;
      box-sizing: border-box;
      max-width: 1364px;
      width: 92vw;
      max-height: 94vh;
      overflow-y: auto;
      box-shadow: 0 30px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
      animation: tb-slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    @media (max-width: 1350px) {
      .tb-beautify-modal { padding: 24px; }
    }
    @media (max-width: 700px) {
      .tb-beautify-modal { padding: 16px; border-radius: 14px; }
    }
    .tb-beautify-modal::-webkit-scrollbar { width: 8px; }
    .tb-beautify-modal::-webkit-scrollbar-track { background: transparent; }
    .tb-beautify-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

    /* Header */
    .tb-beautify-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; padding-bottom: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .tb-beautify-header h2 { color: #f0f2f8; font-size: 24px; font-weight: 800; margin: 0; }
    .tb-beautify-header-format { color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 4px; font-weight: 500; }
    .tb-beautify-credit {
      color: rgba(255,255,255,0.25); font-size: 11px; font-weight: 500;
      text-decoration: none; transition: color 0.2s;
      margin-left: auto; margin-right: 12px;
    }
    .tb-beautify-credit:hover { color: rgba(255,255,255,0.5); }
    .tb-beautify-close {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5); width: 38px; height: 38px; border-radius: 10px;
      font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .tb-beautify-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

    /* Open Teamsheet Toggle */
    .tb-open-teamsheet-toggle {
      display: flex; align-items: center; gap: 10px;
      margin-left: 24px; margin-right: auto;
      user-select: none;
    }
    .tb-open-teamsheet-toggle label {
      color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500;
      cursor: pointer; white-space: nowrap;
    }
    .tb-toggle-switch {
      position: relative; width: 40px; height: 22px; flex-shrink: 0;
    }
    .tb-toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; pointer-events: none; }
    .tb-toggle-slider {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.1); border-radius: 11px;
      cursor: pointer; transition: background 0.25s;
      z-index: 1;
    }
    .tb-toggle-slider::before {
      content: ''; position: absolute; left: 3px; top: 3px;
      width: 16px; height: 16px; border-radius: 50%;
      background: rgba(255,255,255,0.5); transition: transform 0.25s, background 0.25s;
    }
    .tb-toggle-switch input:checked + .tb-toggle-slider {
      background: rgba(124,77,255,0.5);
    }
    .tb-toggle-switch input:checked + .tb-toggle-slider::before {
      transform: translateX(18px); background: #7c4dff;
    }

    /* Open Teamsheet mode: hide nature/evs/ivs */
    .tb-beautify-modal.tb-open-teamsheet .tb-card-nature,
    .tb-beautify-modal.tb-open-teamsheet .tb-card-evs-row,
    .tb-beautify-modal.tb-open-teamsheet .tb-card-ivs-row,
    .tb-beautify-modal.tb-open-teamsheet .tb-detail-nature,
    .tb-beautify-modal.tb-open-teamsheet .tb-detail-evs-row,
    .tb-beautify-modal.tb-open-teamsheet .tb-detail-ivs-row { display: none !important; }
    .tb-beautify-modal.tb-open-teamsheet .tb-detail-stats { display: none !important; }

    /* Grid */
    .tb-beautify-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
    }
    @media (max-width: 860px) { .tb-beautify-grid { grid-template-columns: 1fr; } }
    @media (max-width: 500px) { .tb-beautify-grid { gap: 10px; } }
    @media (min-width: 1350px) { .tb-beautify-grid { grid-template-columns: repeat(3, 1fr); } }

    /* Card */
    .tb-card {
      background: #242840; border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer; display: flex; flex-direction: column;
    }
    .tb-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    /* Card header */
    .tb-card-header {
      padding: 12px 18px; display: flex; align-items: center;
      justify-content: space-between; min-height: 52px; position: relative;
    }
    .tb-card-header-left { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .tb-card-name {
      font-size: 18px; font-weight: 800; color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.4); letter-spacing: 0.3px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .tb-card-nickname { font-size: 12px; color: rgba(255,255,255,0.65); font-weight: 500; }
    .tb-card-header-types { display: flex; gap: 5px; flex-shrink: 0; }

    /* Type badge */
    .tb-type-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.8px; line-height: 1.4;
      border: 1px solid rgba(255,255,255,0.12);
    }

    /* Card body */
    .tb-card-body { display: flex; padding: 14px 18px 16px; gap: 16px; flex: 1; }

    /* Sprite column */
    .tb-card-sprite-col {
      flex-shrink: 0; width: 110px; display: flex;
      flex-direction: column; align-items: center; gap: 10px;
    }
    .tb-card-sprite-wrap {
      width: 110px; height: 110px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .tb-card-sprite {
      width: 110px; height: 110px; image-rendering: auto;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.3));
      background-size: 110px !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }

    /* Item badge */
    .tb-card-item-badge {
      display: flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 4px 10px 4px 0; max-width: 110px;
    }
    .tb-card-item-icon {
      width: 24px; height: 24px; display: inline-block;
      flex-shrink: 0; image-rendering: pixelated;
    }
    .tb-card-item-name {
      font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Info column */
    .tb-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }

    /* Info table */
    .tb-card-info-table {
      display: grid; grid-template-columns: auto 1fr;
      gap: 3px 12px; align-items: baseline; margin-bottom: auto;
    }
    .tb-card-label {
      color: rgba(255,255,255,0.35); font-weight: 700; font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.8px; padding: 2px 0; white-space: nowrap;
    }
    .tb-card-value {
      color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600;
      padding: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .tb-tera-badge {
      display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 5px;
      font-size: 11px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.12);
    }
    .tb-card-evs {
      font-size: 11px; color: rgba(255,255,255,0.55); font-weight: 500;
      white-space: normal; word-break: break-word; line-height: 1.4;
    }

    /* Moves grid */
    .tb-card-moves { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 6px; }
    .tb-move-pill {
      display: flex; align-items: center; padding: 6px 10px; border-radius: 8px;
      font-size: 11.5px; font-weight: 700; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; transition: filter 0.15s;
      border: none;
    }
    .tb-move-pill:hover { filter: brightness(1.15); }

    /* ===== Detail View ===== */
    .tb-detail { animation: tb-fadeIn 0.3s ease; }
    .tb-detail-back {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.7); border-radius: 10px; padding: 8px 18px;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
      display: inline-flex; align-items: center; gap: 6px; margin-bottom: 24px;
    }
    .tb-detail-back:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .tb-detail-content { display: flex; gap: 36px; align-items: stretch; }
    @media (max-width: 1100px) {
      .tb-detail-content { gap: 24px; }
      .tb-detail-left { width: 260px !important; }
      .tb-detail-sprite-wrap { width: 200px !important; height: 200px !important; }
      .tb-detail-name { font-size: 28px !important; }
    }
    @media (max-width: 800px) {
      .tb-detail-content { flex-direction: column; align-items: center; gap: 24px; }
      .tb-detail-left { width: 100% !important; max-width: 340px; }
      .tb-detail-sprite-wrap { width: 200px !important; height: 200px !important; }
    }

    /* Detail left — sprite + info */
    .tb-detail-left {
      flex-shrink: 0; display: flex; flex-direction: column;
      align-items: center; gap: 16px; width: 340px;
    }
    .tb-detail-sprite-wrap {
      width: 260px; height: 260px; border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .tb-detail-sprite-inner {
      animation: tb-spriteFloat 3s ease-in-out infinite;
      filter: drop-shadow(0 6px 16px rgba(0,0,0,0.35));
    }
    .tb-detail-sprite-inner img {
      width: 160px; height: 160px; object-fit: contain;
      image-rendering: pixelated;
    }
    .tb-detail-sprite-inner .tb-sprite-bg {
      width: 260px; height: 260px;
      background-size: 240px !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }
    .tb-detail-types { display: flex; gap: 8px; }
    .tb-detail-types .tb-type-badge {
      font-size: 13px; padding: 5px 16px; border-radius: 6px; letter-spacing: 1px;
    }
    .tb-detail-item-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 6px 16px 6px 4px;
    }
    .tb-detail-item-icon {
      width: 24px; height: 24px; display: inline-block;
      flex-shrink: 0; image-rendering: pixelated;
    }
    .tb-detail-item-name { font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 600; }

    /* Detail left info section */
    .tb-detail-left-info {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 20px;
    }
    .tb-detail-info-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; align-items: baseline;
    }
    .tb-detail-label {
      color: rgba(255,255,255,0.35); font-weight: 700; font-size: 11px;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .tb-detail-value { color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; }
    .tb-detail-value-sm { color: rgba(255,255,255,0.6); font-size: 12.5px; font-weight: 500; }

    /* Detail right — name, stats, moves */
    .tb-detail-right { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .tb-detail-name {
      font-size: 36px; font-weight: 900; color: #fff; margin: 0 0 2px 0; letter-spacing: -0.5px;
    }
    .tb-detail-nickname {
      font-size: 16px; color: rgba(255,255,255,0.45); font-weight: 500; margin-bottom: 28px;
    }

    /* Stat bars */
    .tb-detail-stats { margin-bottom: 28px; }
    .tb-detail-section-title {
      color: rgba(255,255,255,0.35); font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 14px 0;
    }
    .tb-stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .tb-stat-name {
      width: 36px; color: rgba(255,255,255,0.45); font-size: 12px;
      font-weight: 700; text-transform: uppercase; text-align: right; line-height: 1;
    }
    .tb-stat-base {
      width: 28px; color: rgba(255,255,255,0.35); font-size: 12px;
      font-weight: 600; text-align: right; line-height: 1;
    }
    .tb-stat-ev {
      width: 32px; color: rgba(255,255,255,0.35); font-size: 12px;
      font-weight: 600; text-align: right; line-height: 1;
    }
    .tb-stat-num {
      width: 36px; color: rgba(255,255,255,0.9); font-size: 14px;
      font-weight: 700; text-align: right; line-height: 1;
    }
    .tb-stat-bar-bg {
      flex: 1; height: 14px; background: rgba(255,255,255,0.05);
      border-radius: 7px; overflow: hidden; position: relative;
    }
    .tb-stat-bar {
      height: 100%; border-radius: 7px; animation: tb-barGrow 0.6s ease-out;
      position: absolute; left: 0; top: 0;
    }
    /* Detail moves */
    .tb-detail-moves-section { margin-top: auto; }
    .tb-detail-moves { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .tb-detail-move {
      border-radius: 10px; padding: 10px 14px; display: flex;
      flex-direction: column; gap: 4px; transition: filter 0.15s;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .tb-detail-move:hover { filter: brightness(1.12); }
    .tb-detail-move-name { font-size: 14px; font-weight: 700; }
    .tb-detail-move-meta { font-size: 11px; opacity: 0.75; font-weight: 500; }

    /* Teamsheet button */
    .tb-beautify-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff !important; border: none; border-radius: 8px;
      padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
      transition: all 0.2s; display: inline-flex; align-items: center; gap: 5px;
      margin-left: 5px; vertical-align: middle;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2); letter-spacing: 0.3px;
    }
    .tb-beautify-btn:hover {
      filter: brightness(1.12); transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
    }
    .tb-beautify-btn:active { transform: translateY(0); }
    .tb-beautify-btn svg { width: 14px; height: 14px; }

    /* Footer */
    .tb-beautify-footer {
      margin-top: 24px; padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .tb-beautify-footer-btn {
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 9px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .tb-beautify-footer-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .tb-beautify-footer-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff; border-color: transparent;
    }
    .tb-beautify-footer-btn.primary:hover { filter: brightness(1.1); }
  `;

  function injectCSS() {
    if (document.getElementById('tb-beautify-css')) return;
    var style = document.createElement('style');
    style.id = 'tb-beautify-css';
    style.textContent = OVERLAY_CSS;
    document.head.appendChild(style);
  }

  // ============================================================
  // Render a card (grid view)
  // ============================================================

  function renderCard(set, index) {
    var types = getTypesForSet(set);
    var primaryType = types[0] || 'Normal';
    var tc1 = getTypeColor(primaryType);

    var headerBg;
    if (types[1]) {
      var tc2 = getTypeColor(types[1]);
      headerBg = 'linear-gradient(135deg, ' + tc1.bg + ' 0%, ' + tc1.bg + ' 45%, ' + tc2.bg + ' 100%)';
    } else {
      headerBg = 'linear-gradient(135deg, ' + tc1.bg + ', ' + tc1.bg + 'cc)';
    }

    var spriteBg = tc1.dark + '30';
    var displayName = getDisplayName(set);
    var nickname = set.name && set.name !== set.species ? set.name : '';
    var abilityName = getAbilityName(set.ability);
    var itemName = getItemName(set.item);
    var natureName = set.nature || '';
    var evStr = formatEVs(set.evs);
    var ivStr = formatIVs(set.ivs);
    var teraType = set.teraType || '';
    var spriteStyle = getSpriteStyle(set);

    var typeIconsHTML = types.map(function(t) {
      var tc = getTypeColor(t);
      return '<span class="tb-type-badge" style="background:' + tc.bg + ';color:' + tc.text + ';">' + escapeHTML(t) + '</span>';
    }).join('');

    var movesHTML = (set.moves || []).filter(Boolean).map(function(move) {
      var tc = getTypeColor(getMoveType(move));
      return '<div class="tb-move-pill" style="background:' + tc.bg + ';color:' + tc.text + ';text-shadow:' +
        (tc.text === '#fff' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none') + ';" title="' + escapeHTML(getMoveName(move)) + '">' +
        escapeHTML(getMoveName(move)) + '</div>';
    }).join('');

    var itemIconHTML = '';
    if (set.item) {
      var itemStyle = getItemIconStyle(set.item);
      if (itemStyle) itemIconHTML = '<span class="tb-card-item-icon" style="' + itemStyle + '"></span>';
    }

    var teraBadgeHTML = '';
    if (teraType) {
      var teraColor = getTypeColor(teraType);
      teraBadgeHTML = '<span class="tb-tera-badge" style="background:' + teraColor.bg + ';color:' + teraColor.text + ';">' + escapeHTML(teraType) + '</span>';
    }

    return '' +
      '<div class="tb-card" data-index="' + index + '">' +
        '<div class="tb-card-header" style="background:' + headerBg + ';">' +
          '<div class="tb-card-header-left">' +
            '<span class="tb-card-name">' + escapeHTML(displayName) + '</span>' +
            (nickname ? '<span class="tb-card-nickname">' + escapeHTML(nickname) + '</span>' : '') +
          '</div>' +
          '<div class="tb-card-header-types">' + typeIconsHTML + '</div>' +
        '</div>' +
        '<div class="tb-card-body">' +
          '<div class="tb-card-sprite-col">' +
            '<div class="tb-card-sprite-wrap" style="background:' + spriteBg + ';">' +
              '<div class="tb-card-sprite" style="' + spriteStyle + '"></div>' +
            '</div>' +
            (itemName ? '<div class="tb-card-item-badge">' + itemIconHTML +
              '<span class="tb-card-item-name">' + escapeHTML(itemName) + '</span></div>' : '') +
          '</div>' +
          '<div class="tb-card-info">' +
            '<div class="tb-card-info-table">' +
              '<span class="tb-card-label">Ability</span>' +
              '<span class="tb-card-value">' + escapeHTML(abilityName) + '</span>' +
              (teraType ? '<span class="tb-card-label">Tera</span><span class="tb-card-value">' + teraBadgeHTML + '</span>' : '') +
              '<span class="tb-card-label tb-card-nature">Nature</span>' +
              '<span class="tb-card-value tb-card-nature">' + escapeHTML(natureName) + '</span>' +
              (evStr ? '<span class="tb-card-label tb-card-evs-row">EVs</span><span class="tb-card-evs tb-card-evs-row">' + escapeHTML(evStr) + '</span>' : '') +
              (ivStr ? '<span class="tb-card-label tb-card-ivs-row">IVs</span><span class="tb-card-evs tb-card-ivs-row">' + escapeHTML(ivStr) + '</span>' : '') +
            '</div>' +
            '<div class="tb-card-moves">' + movesHTML + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================================
  // Detail View
  // ============================================================

  function getStatColor(value, level) {
    // Scale thresholds by level (base thresholds are for level 100)
    var scale = 2 * (level || 100) / 100;
    if (value < 80 * scale) return '#f44336';
    if (value < 120 * scale) return '#ff9800';
    if (value < 160 * scale) return '#ffc107';
    if (value < 200 * scale) return '#8bc34a';
    if (value < 260 * scale) return '#4caf50';
    return '#00bcd4';
  }

  function getComputedStats(set) {
    var stats = {};
    var keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    try {
      var gen = (pageWindow.app && pageWindow.app.rooms && pageWindow.app.rooms.teambuilder &&
        pageWindow.app.rooms.teambuilder.curTeam && pageWindow.app.rooms.teambuilder.curTeam.gen)
        ? 'gen' + pageWindow.app.rooms.teambuilder.curTeam.gen : 'gen9';
      var guesser = new pageWindow.BattleStatGuesser(gen);
      for (var i = 0; i < keys.length; i++) {
        stats[keys[i]] = guesser.getStat(keys[i], set);
      }
    } catch (e) {
      // Fallback: just use base stats
      var base = getBaseStats(set.species);
      for (var j = 0; j < keys.length; j++) {
        stats[keys[j]] = base[keys[j]] || 0;
      }
    }
    return stats;
  }

  var natureModifiers = {
    Adamant: { plus: 'atk', minus: 'spa' },
    Bold: { plus: 'def', minus: 'atk' },
    Brave: { plus: 'atk', minus: 'spe' },
    Calm: { plus: 'spd', minus: 'atk' },
    Careful: { plus: 'spd', minus: 'spa' },
    Gentle: { plus: 'spd', minus: 'def' },
    Hasty: { plus: 'spe', minus: 'def' },
    Impish: { plus: 'def', minus: 'spa' },
    Jolly: { plus: 'spe', minus: 'spa' },
    Lax: { plus: 'def', minus: 'spd' },
    Lonely: { plus: 'atk', minus: 'def' },
    Mild: { plus: 'spa', minus: 'def' },
    Modest: { plus: 'spa', minus: 'atk' },
    Naive: { plus: 'spe', minus: 'spd' },
    Naughty: { plus: 'atk', minus: 'spd' },
    Quiet: { plus: 'spa', minus: 'spe' },
    Rash: { plus: 'spa', minus: 'spd' },
    Relaxed: { plus: 'def', minus: 'spe' },
    Sassy: { plus: 'spd', minus: 'spe' },
    Timid: { plus: 'spe', minus: 'atk' }
  };

  function renderDetailView(set) {
    var types = getTypesForSet(set);
    var primaryType = types[0] || 'Normal';
    var tc1 = getTypeColor(primaryType);
    var displayName = getDisplayName(set);
    var nickname = set.name && set.name !== set.species ? set.name : '';
    var abilityName = getAbilityName(set.ability);
    var itemName = getItemName(set.item);
    var natureName = set.nature || '';
    var evStr = formatEVs(set.evs);
    var ivStr = formatIVs(set.ivs);
    var teraType = set.teraType || '';
    var baseStats = getBaseStats(set.species);

    var spriteBg = 'radial-gradient(circle at 50% 50%, ' + tc1.bg + '30, ' + tc1.dark + '15)';

    // Try animated sprite first, fall back to Dex sprite
    var animatedUrl = getAnimatedSpriteURL(set.species);
    var dexStyle = getSpriteStyle(set);

    // Type badges
    var typeBadgesHTML = types.map(function(t) {
      var tc = getTypeColor(t);
      return '<span class="tb-type-badge" style="background:' + tc.bg + ';color:' + tc.text + ';">' + escapeHTML(t) + '</span>';
    }).join('');

    // Item
    var itemHTML = '';
    if (itemName) {
      var itemStyle = getItemIconStyle(set.item);
      var iconSpan = itemStyle ? '<span class="tb-detail-item-icon" style="' + itemStyle + '"></span>' : '';
      itemHTML = '<div class="tb-detail-item-badge">' + iconSpan +
        '<span class="tb-detail-item-name">' + escapeHTML(itemName) + '</span></div>';
    }

    // Tera
    var teraHTML = '';
    if (teraType) {
      var teraColor = getTypeColor(teraType);
      teraHTML = '<span class="tb-tera-badge" style="background:' + teraColor.bg + ';color:' + teraColor.text + ';">' + escapeHTML(teraType) + '</span>';
    }

    // Stat bars — computed stats via Showdown's BattleStatGuesser
    var statKeys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    var statLabels = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
    var natMod = natureModifiers[natureName] || {};
    var computedStats = getComputedStats(set);

    // Max stat for bar scaling — use highest computed stat in the set, minimum 200
    var maxStatVal = Math.max(200, Math.max.apply(null, statKeys.map(function(k) { return computedStats[k]; })));

    var statsHTML = statKeys.map(function(key) {
      var val = computedStats[key];
      var base = baseStats[key] || 0;
      var ev = (set.evs || {})[key] || 0;
      var pct = Math.min(100, (val / maxStatVal) * 100);
      var color = getStatColor(val, set.level || 100);
      // Nature highlight: red for boosted, blue for reduced
      var nameStyle = '';
      var numStyle = '';
      if (natMod.plus === key) {
        nameStyle = ' style="color:#f44336;"';
        numStyle = ' style="color:#f44336;"';
      } else if (natMod.minus === key) {
        nameStyle = ' style="color:#42a5f5;"';
        numStyle = ' style="color:#42a5f5;"';
      }
      return '<div class="tb-stat-row">' +
        '<span class="tb-stat-name"' + nameStyle + '>' + statLabels[key] + '</span>' +
        '<span class="tb-stat-base">' + base + '</span>' +
        '<div class="tb-stat-bar-bg">' +
          '<div class="tb-stat-bar" style="width:' + pct + '%;background:' + color + ';"></div>' +
        '</div>' +
        '<span class="tb-stat-ev">' + (ev > 0 ? '+' + ev : '') + '</span>' +
        '<span class="tb-stat-num"' + numStyle + '>' + val + '</span>' +
      '</div>';
    }).join('');

    var bst = statKeys.reduce(function(sum, k) { return sum + (baseStats[k] || 0); }, 0);

    // Moves with details
    var movesHTML = (set.moves || []).filter(Boolean).map(function(move) {
      var moveName = getMoveName(move);
      var moveType = getMoveType(move);
      var tc = getTypeColor(moveType);
      var cat = getMoveCategory(move);
      var power = getMovePower(move);
      var acc = getMoveAccuracy(move);
      var meta = cat;
      if (power) meta += ' | ' + power + ' BP';
      if (acc === true) meta += ' | —%';
      else if (acc) meta += ' | ' + acc + '%';
      return '<div class="tb-detail-move" style="background:' + tc.bg + '22;">' +
        '<span class="tb-detail-move-name" style="color:' + tc.bg + ';">' + escapeHTML(moveName) + '</span>' +
        '<span class="tb-detail-move-meta" style="color:rgba(255,255,255,0.5);">' + meta + '</span>' +
      '</div>';
    }).join('');

    return '' +
      '<div class="tb-detail">' +
        '<button class="tb-detail-back">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="15 18 9 12 15 6"></polyline>' +
          '</svg>' +
          'Back to Team' +
        '</button>' +
        '<div class="tb-detail-content">' +
          '<div class="tb-detail-left">' +
            '<div class="tb-detail-sprite-wrap" style="background:' + spriteBg + ';">' +
              '<div class="tb-detail-sprite-inner">' +
                '<img src="' + animatedUrl + '" alt="' + escapeHTML(displayName) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">' +
                '<div class="tb-sprite-bg" style="display:none;' + dexStyle + '"></div>' +
              '</div>' +
            '</div>' +
            '<div class="tb-detail-types">' + typeBadgesHTML + '</div>' +
            itemHTML +
            '<div class="tb-detail-left-info">' +
              '<div class="tb-detail-info-grid">' +
                '<span class="tb-detail-label">Ability</span>' +
                '<span class="tb-detail-value">' + escapeHTML(abilityName) + '</span>' +
                (teraType ? '<span class="tb-detail-label">Tera</span><span class="tb-detail-value">' + teraHTML + '</span>' : '') +
                '<span class="tb-detail-label tb-detail-nature">Nature</span>' +
                '<span class="tb-detail-value tb-detail-nature">' + escapeHTML(natureName) + '</span>' +
                (evStr ? '<span class="tb-detail-label tb-detail-evs-row">EVs</span><span class="tb-detail-value-sm tb-detail-evs-row">' + escapeHTML(evStr) + '</span>' : '') +
                (ivStr ? '<span class="tb-detail-label tb-detail-ivs-row">IVs</span><span class="tb-detail-value-sm tb-detail-ivs-row">' + escapeHTML(ivStr) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tb-detail-right">' +
            '<h2 class="tb-detail-name">' + escapeHTML(displayName) + '</h2>' +
            (nickname ? '<div class="tb-detail-nickname">' + escapeHTML(nickname) + '</div>' : '<div style="margin-bottom:24px;"></div>') +
            '<div class="tb-detail-stats">' +
              '<h3 class="tb-detail-section-title">Stats (BST: ' + bst + ')</h3>' +
              statsHTML +
            '</div>' +
            '<div class="tb-detail-moves-section">' +
              '<div class="tb-detail-section-title">Moves</div>' +
              '<div class="tb-detail-moves">' + movesHTML + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================================
  // State: track current sets for detail view
  // ============================================================

  var _currentSets = null;

  function switchToDetail(overlay, index) {
    if (!_currentSets || !_currentSets[index]) return;
    var set = _currentSets[index];
    var modal = overlay.querySelector('.tb-beautify-modal');

    // Hide grid + footer, show detail
    var grid = modal.querySelector('.tb-beautify-grid');
    var footer = modal.querySelector('.tb-beautify-footer');
    if (grid) grid.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Remove previous detail if any
    var oldDetail = modal.querySelector('.tb-detail');
    if (oldDetail) oldDetail.remove();

    var detailDiv = document.createElement('div');
    detailDiv.innerHTML = renderDetailView(set);
    var detailEl = detailDiv.firstElementChild;
    modal.appendChild(detailEl);

    // Scroll to top of modal
    modal.scrollTop = 0;

    // Back button
    detailEl.querySelector('.tb-detail-back').addEventListener('click', function() {
      detailEl.remove();
      if (grid) grid.style.display = '';
      if (footer) footer.style.display = '';
    });
  }

  // ============================================================
  // Show Teamsheet
  // ============================================================

  // ============================================================
  // Zoom compensation — counter browser zoom so overlay renders at 1:1
  // ============================================================

  function applyViewportFit(overlay) {
    var modal = overlay.querySelector('.tb-beautify-modal');
    if (!modal) return;
    // Smoothly scale down when viewport is smaller than the ideal modal width.
    // At 1400px+ viewport: no scaling (full size).
    // Below 1400px: linearly scale from 1.0 down to 0.7 at 600px.
    var vw = window.innerWidth;
    if (vw < 1400) {
      var scale = 0.7 + 0.3 * Math.min(1, (vw - 600) / 800);
      scale = Math.max(0.6, Math.min(1, scale));
      modal.style.zoom = scale.toFixed(4);
    } else {
      modal.style.zoom = '';
    }
  }

  function showTeamsheet() {
    var sets = getCurrentTeamSets();
    if (!sets || sets.length === 0) {
      alert('No team data found. Please select a team in the teambuilder first.');
      return;
    }

    closeTeamsheet();
    _currentSets = sets;

    var teamName = getCurrentTeamName();
    var format = getCurrentTeamFormat();
    var cardsHTML = sets.map(function(set, i) { return renderCard(set, i); }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'tb-beautify-overlay';


    overlay.innerHTML = '' +
      '<div class="tb-beautify-modal">' +
        '<div class="tb-beautify-header">' +
          '<div>' +
            '<h2>' + escapeHTML(teamName) + '</h2>' +
            (format ? '<div class="tb-beautify-header-format">' + escapeHTML(format) + '</div>' : '') +
          '</div>' +
          '<div class="tb-open-teamsheet-toggle">' +
            '<label for="tb-open-teamsheet-cb">Open Teamsheet</label>' +
            '<div class="tb-toggle-switch">' +
              '<input type="checkbox" id="tb-open-teamsheet-cb">' +
              '<span class="tb-toggle-slider"></span>' +
            '</div>' +
          '</div>' +
          '<a class="tb-beautify-credit" href="https://fulllifegames.com" target="_blank" rel="noopener">Created by Bene</a>' +
          '<button class="tb-beautify-close" title="Close">&times;</button>' +
        '</div>' +
        '<div class="tb-beautify-grid">' + cardsHTML + '</div>' +
        '<div class="tb-beautify-footer">' +
          '<button class="tb-beautify-footer-btn" data-action="export-image">Copy as Image</button>' +
          '<button class="tb-beautify-footer-btn primary" data-action="close">Close</button>' +
        '</div>' +
      '</div>';

    // Events
    overlay.querySelector('.tb-beautify-close').addEventListener('click', closeTeamsheet);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeTeamsheet(); });

    var exportBtn = overlay.querySelector('[data-action="export-image"]');
    if (exportBtn) exportBtn.addEventListener('click', function() {
      exportTeamsheetAsImage(overlay.querySelector('.tb-beautify-modal'));
    });

    var closeBtn = overlay.querySelector('[data-action="close"]');
    if (closeBtn) closeBtn.addEventListener('click', closeTeamsheet);

    // Open Teamsheet toggle
    var openTsCb = overlay.querySelector('#tb-open-teamsheet-cb');
    var openTsSlider = overlay.querySelector('.tb-toggle-slider');
    if (openTsCb) {
      var applyToggle = function() {
        var modal = overlay.querySelector('.tb-beautify-modal');
        if (openTsCb.checked) modal.classList.add('tb-open-teamsheet');
        else modal.classList.remove('tb-open-teamsheet');
      };
      openTsCb.addEventListener('change', applyToggle);
      if (openTsSlider) openTsSlider.addEventListener('click', function(e) {
        e.preventDefault();
        openTsCb.checked = !openTsCb.checked;
        applyToggle();
      });
    }

    // Card click -> detail view
    overlay.querySelectorAll('.tb-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(card.getAttribute('data-index'), 10);
        switchToDetail(overlay, idx);
      });
    });

    overlay._keyHandler = function(e) { if (e.key === 'Escape') closeTeamsheet(); };
    document.addEventListener('keydown', overlay._keyHandler);

    // Apply zoom compensation before adding to DOM
    applyViewportFit(overlay);
    overlay._resizeHandler = function() { applyViewportFit(overlay); };
    window.addEventListener('resize', overlay._resizeHandler);

    document.body.appendChild(overlay);
  }

  function closeTeamsheet() {
    var overlay = document.querySelector('.tb-beautify-overlay');
    if (overlay) {
      if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
      if (overlay._resizeHandler) window.removeEventListener('resize', overlay._resizeHandler);
      overlay.remove();
    }
    _currentSets = null;
  }

  // ============================================================
  // Export
  // ============================================================

  function loadHtml2Canvas() {
    return new Promise(function(resolve, reject) {
      if (typeof html2canvas !== 'undefined') return resolve(html2canvas);
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = function() { resolve(html2canvas); };
      script.onerror = function() { reject(new Error('Failed to load html2canvas')); };
      document.head.appendChild(script);
    });
  }

  async function exportTeamsheetAsImage(modalEl) {
    try {
      // Hide toggle and close button during export
      var toggle = modalEl.querySelector('.tb-open-teamsheet-toggle');
      var closeEl = modalEl.querySelector('.tb-beautify-close');
      if (toggle) toggle.style.display = 'none';
      if (closeEl) closeEl.style.display = 'none';
      var h2c = await loadHtml2Canvas();
      var canvas = await h2c(modalEl, { backgroundColor: '#1a1d2e', scale: 2, useCORS: true });
      if (toggle) toggle.style.display = '';
      if (closeEl) closeEl.style.display = '';
      canvas.toBlob(function(blob) {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function() {
            showToast('Teamsheet copied to clipboard!');
          }).catch(function() { downloadBlob(blob, 'teamsheet.png'); });
        } else if (blob) { downloadBlob(blob, 'teamsheet.png'); }
      }, 'image/png');
    } catch (e) {
      console.warn('[Teambuilder Beautify] Image export failed:', e);
      // Fallback: copy team text
      var sets = getCurrentTeamSets();
      if (sets && pageWindow.Storage && pageWindow.Storage.exportTeam) {
        var text = pageWindow.Storage.exportTeam(sets);
        navigator.clipboard.writeText(text).then(function() {
          showToast('Team text copied to clipboard! (Image export failed)');
        });
      }
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
      'background:rgba(30,33,50,0.95);color:#fff;padding:14px 28px;border-radius:12px;' +
      'font-size:14px;z-index:200000;animation:tb-fadeIn 0.2s ease;' +
      'box-shadow:0 8px 30px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);font-weight:600;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  }

  // ============================================================
  // Inject button
  // ============================================================

  function injectButton() {
    var rooms = document.querySelectorAll('[id^="room-teambuilder"]');
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      if (room.querySelector('.tb-beautify-btn')) continue;
      var importBtn = room.querySelector('button[name="import"]');
      if (!importBtn) continue;
      var btn = document.createElement('button');
      btn.className = 'tb-beautify-btn';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>' +
        '<rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>' +
        '</svg>Teamsheet';
      btn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); showTeamsheet(); });
      importBtn.parentElement.insertBefore(btn, importBtn.nextSibling);
    }
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================
  // Init
  // ============================================================

  function init() {
    injectCSS();
    setInterval(function() { try { injectButton(); } catch (e) {} }, 1000);
    console.log('[Teambuilder Beautify] Loaded successfully!');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('DOMContentLoaded', function() { setTimeout(init, 500); });
  }
})();
