/* @flow */

import sinon from 'sinon';
const sinonTest = require('sinon-test')(sinon);
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import FloatAnchor from '../src';

window.requestAnimationFrame = function() {};

test('mounts', sinonTest(function() {
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

  expect(divs.map(div => div.textContent)).toEqual(['foo', 'blah']);
  const foo = divs[0];

  const float = document.querySelector('.floatedThing');
  if (!float) throw new Error('should not happen');
  const floatParent = float.parentNode;
  expect(float.textContent).toBe('blah');

  expect(Symbol.iterator in FloatAnchor.parentNodes(float)).toBe(true);
  expect('next' in FloatAnchor.parentNodes(float)).toBe(true);

  const parentNodes = Array.from(FloatAnchor.parentNodes(float));
  expect(parentNodes[0]).toBe(float);
  expect(parentNodes[1]).toBe(floatParent);
  expect(parentNodes[2]).toBe(foo);
  expect(parentNodes[3]).toBe(mountPoint);
  expect(parentNodes.length).toBe(4);

  expect((floatParent: any).rfaAnchor).toBe(foo);

  const floatContainer = float.parentElement;
  if (!(floatContainer instanceof HTMLElement)) throw new Error('Failed to find container');
  expect(floatContainer.style.zIndex).toBe('1337');

  ReactDOM.unmountComponentAtNode(mountPoint);

  expect(document.querySelector('.floatedThing')).toBe(null);
  expect((floatParent: any).rfaAnchor).toBe(undefined);
}));

test('rfaAnchor updates if anchor element changes', () => {
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
  expect(divs.map(div => div.textContent)).toEqual(['foo', 'blah']);
  const foo = divs[0];

  const float = document.querySelector('.floatedThing');
  if (!float) throw new Error('should not happen');
  const floatParent = float.parentNode;

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(foo);
    expect(parentNodes[3]).toBe(mountPoint);
    expect(parentNodes.length).toBe(4);
  }

  expect((floatParent: any).rfaAnchor).toBe(foo);

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
  expect(ps.map(div => div.textContent)).toEqual(['bar']);
  const bar = ps[0];

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(bar);
    expect(parentNodes[3]).toBe(mountPoint);
    expect(parentNodes.length).toBe(4);
  }

  expect((floatParent: any).rfaAnchor).toBe(bar);

  ReactDOM.unmountComponentAtNode(mountPoint);
});

test('float can be added and removed', () => {
  const mountPoint = document.createElement('div');

  ReactDOM.render(
    <FloatAnchor
      anchor={
        <div>foo</div>
      }
      float={null}
      zIndex={1337}
    />,
    mountPoint
  );

  expect(document.querySelector('.floatedThing')).toBeFalsy();

  ReactDOM.render(
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
  );

  const floatedThing = document.querySelector('.floatedThing');
  if (!floatedThing) throw new Error('missing floatedThing');

  const floatedThingParent = floatedThing.parentElement;
  if (!floatedThingParent) throw new Error();

  expect(document.contains(floatedThingParent)).toBe(true);

  ReactDOM.render(
    <FloatAnchor
      anchor={
        <div>foo</div>
      }
      float={null}
      zIndex={1337}
    />,
    mountPoint
  );

  expect(document.querySelector('.floatedThing')).toBeFalsy();
  expect(document.contains(floatedThingParent)).toBe(false);

  ReactDOM.unmountComponentAtNode(mountPoint);
});

test('can add a (custom) class to the portal', () => {
  TestUtils.renderIntoDocument(
    <FloatAnchor
      anchor={<div>foo</div>}
      float={<div>bar</div>}
      zIndex={1337}
    />
  );
 
  expect(document.querySelector('.floating-portal')).toBeTruthy();

  TestUtils.renderIntoDocument(
    <FloatAnchor
      className='my-floating-portal'
      anchor={<div>foo</div>}
      float={<div>bar</div>}
      zIndex={1337}
    />
  );

  expect(document.querySelector('.my-floating-portal')).toBeTruthy();
});