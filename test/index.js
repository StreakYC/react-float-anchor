/* @flow */

import './lib/testdom';
import assert from 'assert';
import sinon from 'sinon';
const sinonTest = require('sinon-test')(sinon);
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import FloatAnchor from '../src';

describe('FloatAnchor', function() {
  it('mounts', sinonTest(function() {
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

    const float = document.querySelector('.floatedThing');
    if (!float) throw new Error('should not happen');
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
    //eslint-disable-next-line react/no-find-dom-node
    assert.strictEqual(ReactDOM.findDOMNode(root.portal), float);

    ReactDOM.unmountComponentAtNode(mountPoint);

    assert.equal(document.querySelector('.floatedThing'), null);
    assert.strictEqual((floatParent: any).rfaAnchor, undefined);
  }));

  it('rfaAnchor updates if anchor element changes', function() {
    this.slow();

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

    const float = document.querySelector('.floatedThing');
    if (!float) throw new Error('should not happen');
    const floatParent = float.parentNode;

    {
      const parentNodes = Array.from(FloatAnchor.parentNodes(float));
      assert.strictEqual(parentNodes[0], float);
      assert.strictEqual(parentNodes[1], floatParent);
      assert.strictEqual(parentNodes[2], foo);
      assert.strictEqual(parentNodes[3], mountPoint);
      assert.strictEqual(parentNodes.length, 4);
    }

    assert.strictEqual((floatParent: any).rfaAnchor, foo);

    ReactDOM.render(
      <FloatAnchor
        anchor={
          <p>bar</p>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />,
      mountPoint
    );

    const ps = TestUtils.scryRenderedDOMComponentsWithTag(root, 'p');
    assert.deepEqual(ps.map(div => div.textContent), ['bar']);
    const bar = ps[0];

    {
      const parentNodes = Array.from(FloatAnchor.parentNodes(float));
      assert.strictEqual(parentNodes[0], float);
      assert.strictEqual(parentNodes[1], floatParent);
      assert.strictEqual(parentNodes[2], bar);
      assert.strictEqual(parentNodes[3], mountPoint);
      assert.strictEqual(parentNodes.length, 4);
    }

    assert.strictEqual((floatParent: any).rfaAnchor, bar);
  });
});
