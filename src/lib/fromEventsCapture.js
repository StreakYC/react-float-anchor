/* @flow */

import Kefir from 'kefir';

type Emitter = {
  addEventListener: Function;
  removeEventListener: Function;
};

export default function fromEventsCapture(target: Emitter, eventName: string): Object {
  return Kefir.stream(emitter => {
    target.addEventListener(eventName, emitter.emit, true);
    return () => {
      target.removeEventListener(eventName, emitter.emit, true);
    };
  });
}
