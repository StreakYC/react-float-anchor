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

    const float = document.body.querySelector('.floatedThing');
    assert.strictEqual(float.textContent, 'blah');

    const floatContainer = float.parentElement;
    if (!(floatContainer instanceof HTMLElement)) throw new Error('Failed to find container');
    assert.strictEqual(floatContainer.style.zIndex, '1337');

    if (!root.portal) throw new Error('Missing portal property');
    assert.strictEqual(ReactDOM.findDOMNode(root.portal), float);

    ReactDOM.unmountComponentAtNode(mountPoint);

    assert.equal(document.body.querySelector('.floatedThing'), null);
  }));
});
