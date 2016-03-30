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
      />,
      mountPoint
    ): any);

    const divs = TestUtils.scryRenderedDOMComponentsWithTag(root, 'div');

    assert.deepEqual(divs.map(div => div.textContent), ['foo']);

    const float = document.body.querySelector('.floatedThing');
    assert.strictEqual(float.textContent, 'blah');

    ReactDOM.unmountComponentAtNode(mountPoint);

    assert.equal(document.body.querySelector('.floatedThing'), null);
  }));
});
