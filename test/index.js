/* @flow */

import './lib/testdom';
import assert from 'assert';
import sinon from 'sinon';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import FloatAnchor from '../src';

describe('FloatAnchor', function() {
  it('mounts', sinon.test(function() {
    this.slow();
    // TODO test resize and scroll handlers
    this.spy(window, 'addEventListener');
    this.spy(window, 'removeEventListener');
    this.stub(window, 'requestAnimationFrame');

    const mountPoint = document.createElement('div');
    const root: FloatAnchor = (ReactDOM.render(
      <FloatAnchor
        anchor={
          <div>foo</div>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />,
      mountPoint
    ): any);

    const divs = TestUtils.scryRenderedDOMComponentsWithTag(root, 'div');

    assert.deepEqual(divs.map(div => div.textContent), ['foo']);
    const foo = divs[0];

    const float = document.body.querySelector('.floatedThing');
    const floatParent = float.parentNode;
    assert.strictEqual(float.textContent, 'blah');

    assert(Symbol.iterator in FloatAnchor.parentNodes(float));
    assert('next' in FloatAnchor.parentNodes(float));

    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    assert.strictEqual(parentNodes[0], float);
    assert.strictEqual(parentNodes[1], floatParent);
    assert.strictEqual(parentNodes[2], foo);
    assert.strictEqual(parentNodes[3], mountPoint);
    assert.strictEqual(parentNodes.length, 4);

    assert.strictEqual((floatParent: any).rfaAnchor, foo);

    const floatContainer = float.parentElement;
    if (!(floatContainer instanceof HTMLElement)) throw new Error('Failed to find container');
    assert.strictEqual(floatContainer.style.zIndex, '1337');

    if (!root.portal) throw new Error('Missing portal property');
    assert.strictEqual(ReactDOM.findDOMNode(root.portal), float);

    ReactDOM.unmountComponentAtNode(mountPoint);

    assert.equal(document.body.querySelector('.floatedThing'), null);
    assert.strictEqual((floatParent: any).rfaAnchor, undefined);
  }));
});
