/*eslint no-console: "off" */

import { createRoot } from 'react-dom/client';
import Example from './Example';

const onReady = new Promise<unknown>(resolve => {
  if (document.readyState === 'complete') {
    resolve(undefined);
  } else {
    document.addEventListener('DOMContentLoaded', resolve, false);
    window.addEventListener('load', resolve, false);
  }
});

onReady.then(main).catch(e => {
  console.error(e, e.stack);
});

function main() {
  const mainDiv = document.getElementById('main');
  if (!mainDiv) throw new Error('should not happen');
  const root = createRoot(mainDiv);
  root.render(<Example />);
}
