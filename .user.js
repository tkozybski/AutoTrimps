// ==UserScript==
// @name         AutoTrimps-Ray
// @version      1.0-Zek
// @namespace    https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages
// @updateURL    https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages/.user.js
// @description  Automate all the trimps!
// @author       zininzinin, spindrjr, Ishkaru, genBTC, Zeker0
// @include      *trimps.github.io*
// @include      *kongregate.com/games/GreenSatellite/trimps
// @connect      *github.com/Psycho-Ray/AutoTrimps/blob/gh-pages*
// @connect      *trimps.github.io*
// @connect      self
// @grant        GM_xmlhttpRequest 
// ==/UserScript==

var script = document.createElement('script');
script.id = 'AutoTrimps-Ray';
//This can be edited to point to your own Github Repository URL.
script.src = 'https://github.com/Psycho-Ray/AutoTrimps/blob/gh-pages/AutoTrimps2.js';
//script.setAttribute('crossorigin',"use-credentials");
script.setAttribute('crossorigin',"anonymous");
document.head.appendChild(script);

