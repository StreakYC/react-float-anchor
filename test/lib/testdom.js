/* @flow */

function init() {
  if (typeof document !== 'undefined') return;
  const jsdom = require('jsdom').jsdom;
  global.document = jsdom('');
  global.window = document.defaultView;
  global.navigator = window.navigator;
  global.Node = window.Node;
  global.HTMLElement = window.HTMLElement;
  window.requestAnimationFrame = function() {};
}

init();
