/**
 * @flow
 * @jest-environment jsdom
 */

import sinon from 'sinon';
const sinonTest = require('sinon-test')(sinon);
import * as React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import renderer from 'react-test-renderer';
import FloatAnchor from '../src';

function makeRenderCounter() {
  let renderCount = 0;
  function getRenderCount(): number {
    return renderCount;
  }
  function RenderCounter(): React.Node {
    renderCount++;
    return null;
  }
  return {getRenderCount, RenderCounter};
}

beforeEach(() => {
  (document.body: any).textContent = '';
});

test('mounts', sinonTest(function() {
  // TODO test resize and scroll handlers
  this.spy(window, 'addEventListener');
  this.spy(window, 'removeEventListener');
  this.stub(window, 'requestAnimationFrame');

  const mountPoint = document.createElement('div');
  const root: FloatAnchor = (ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo</div>
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
      anchor={anchorRef =>
        <div ref={anchorRef}>foo</div>
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
      anchor={anchorRef =>
        <p ref={anchorRef}>bar</p>
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

test('float can be added and removed', async () => {
  const mountPoint = document.createElement('div');
  const {getRenderCount, RenderCounter} = makeRenderCounter();

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={null}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(1);
  expect(document.querySelector('.floatedThing')).toBeFalsy();

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={
        <div className="floatedThing">blah</div>
      }
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(2);
  const floatedThing = document.querySelector('.floatedThing');
  if (!floatedThing) throw new Error('missing floatedThing');

  const floatedThingParent = floatedThing.parentElement;
  if (!floatedThingParent) throw new Error();

  expect(document.contains(floatedThingParent)).toBe(true);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={null}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(3);
  expect(document.querySelector('.floatedThing')).toBeFalsy();
  expect(document.contains(floatedThingParent)).toBe(false);

  ReactDOM.unmountComponentAtNode(mountPoint);
});

test('can add a (custom) class to the portal', () => {
  TestUtils.renderIntoDocument(
    <FloatAnchor
      floatContainerClassName='my-floating-container'
      anchor={anchorRef => <div ref={anchorRef}>foo</div>}
      float={'abc'}
      zIndex={1337}
    />
  );

  expect(document.querySelector('.my-floating-container')).toBeTruthy();
});

test('supports HTMLElement as anchor', () => {
  const mountPoint = document.createElement('div');
  const anchor = document.createElement('div');
  const anchor2 = document.createElement('div');
  (document.body: any).appendChild(anchor);
  (document.body: any).appendChild(anchor2);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchor}
      float={
        <div className="floatedThing">blah</div>
      }
    />,
    mountPoint
  );

  const float = document.querySelector('.floatedThing');
  if (!float) throw new Error('should not happen');
  const floatParent = float.parentNode;

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(anchor);
    expect(parentNodes[3]).toBe(document.body);
    expect(parentNodes[4]).toBe(document.documentElement);
    expect(parentNodes[5]).toBe(document);
    expect(parentNodes.length).toBe(6);
  }

  expect((floatParent: any).rfaAnchor).toBe(anchor);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchor2}
      float={
        <div className="floatedThing">blah</div>
      }
    />,
    mountPoint
  );

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(anchor2);
    expect(parentNodes[3]).toBe(document.body);
    expect(parentNodes[4]).toBe(document.documentElement);
    expect(parentNodes[5]).toBe(document);
    expect(parentNodes.length).toBe(6);
  }

  expect((floatParent: any).rfaAnchor).toBe(anchor2);

  // switch anchor from HTMLElement to a React element
  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef => <div id="foo" ref={anchorRef}>foo</div>}
      float={
        <div className="floatedThing">blah</div>
      }
    />,
    mountPoint
  );

  const foo = mountPoint.querySelector('#foo');
  if (!foo) throw new Error();

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(foo);
    expect(parentNodes[3]).toBe(mountPoint);
    expect(parentNodes.length).toBe(4);
  }

  expect((floatParent: any).rfaAnchor).toBe(foo);

  // switch anchor back to HTMLElement
  ReactDOM.render(
    <FloatAnchor
      anchor={anchor}
      float={
        <div className="floatedThing">blah</div>
      }
    />,
    mountPoint
  );

  {
    const parentNodes = Array.from(FloatAnchor.parentNodes(float));
    expect(parentNodes[0]).toBe(float);
    expect(parentNodes[1]).toBe(floatParent);
    expect(parentNodes[2]).toBe(anchor);
    expect(parentNodes[3]).toBe(document.body);
    expect(parentNodes[4]).toBe(document.documentElement);
    expect(parentNodes[5]).toBe(document);
    expect(parentNodes.length).toBe(6);
  }

  expect((floatParent: any).rfaAnchor).toBe(anchor);

  ReactDOM.unmountComponentAtNode(mountPoint);
  anchor.remove();
  anchor2.remove();
});

test('supports parentElement', () => {
  const parentElement = document.createElement('div');

  TestUtils.renderIntoDocument(
    <FloatAnchor
      anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
      float={<div className="float">float</div>}
      parentElement={parentElement}
    />
  );

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement.querySelector('.float')).toBeTruthy();
});

test('supports changing parentElement', () => {
  const mountPoint = document.createElement('div');
  const parentElement1 = document.createElement('div');
  const parentElement2 = document.createElement('div');

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
      float={<div className="float">float</div>}
      parentElement={parentElement1}
    />,
    mountPoint
  );

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement1.querySelector('.float')).toBeTruthy();
  expect(parentElement2.querySelector('.float')).toBe(null);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
      float={<div className="float">float</div>}
      parentElement={parentElement2}
    />,
    mountPoint
  );

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement1.querySelector('.float')).toBe(null);
  expect(parentElement2.querySelector('.float')).toBeTruthy();

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
      float={<div className="float">float</div>}
    />,
    mountPoint
  );

  expect(document.querySelector('.float')).toBeTruthy();
  expect(parentElement1.querySelector('.float')).toBe(null);
  expect(parentElement2.querySelector('.float')).toBe(null);
});

test('works with react-test-renderer without float', () => {
  // Doesn't work in react-test-renderer when float prop is non-null, partly
  // because https://github.com/facebook/react/issues/11565
  const component = renderer.create(
    <FloatAnchor
      floatContainerClassName='my-floating-container'
      anchor={anchorRef => <div ref={anchorRef}>foo</div>}
      float={null}
      zIndex={1337}
    />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('element is in DOM during componentDidMount', () => {
  let wasInDomDuringMount = null;

  class MountTester extends React.Component<*> {
    _ref = React.createRef();

    componentDidMount() {
      wasInDomDuringMount =
        (document.body: any).contains(this._ref.current) &&
        document.querySelector('.element-in-dom-test') != null;
    }

    render() {
      return <div ref={this._ref}>foo</div>;
    }
  }

  TestUtils.renderIntoDocument(
    <FloatAnchor
      floatContainerClassName="element-in-dom-test"
      anchor={anchorRef => <div ref={anchorRef}>foo</div>}
      float={<MountTester />}
      zIndex={1337}
    />
  );

  expect(wasInDomDuringMount).toBe(true);
});

test('float choice callback works', async () => {
  const mountPoint = document.createElement('div');
  const {getRenderCount, RenderCounter} = makeRenderCounter();
  const {getRenderCount: getFloatRenderCount, RenderCounter: FloatRenderCounter} = makeRenderCounter();
  const floatCb = jest.fn(choice => <div className="floatedThing">blah<FloatRenderCounter /></div>);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={floatCb}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(2);
  expect(getFloatRenderCount()).toBe(2);
  expect(document.querySelector('.floatedThing')).toBeTruthy();
  expect((document.querySelector('.floatedThing'): any).textContent).toBe('blah');

  expect(floatCb.mock.calls).toEqual([
    [null],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={floatCb}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(3);
  expect(getFloatRenderCount()).toBe(3);
  expect(floatCb.mock.calls).toEqual([
    [null],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  const floatCb2 = jest.fn(choice => <div className="floatedThing">blah2<FloatRenderCounter /></div>);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={floatCb2}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(4);
  expect(getFloatRenderCount()).toBe(4);
  expect(document.querySelector('.floatedThing')).toBeTruthy();
  expect((document.querySelector('.floatedThing'): any).textContent).toBe('blah2');

  expect(floatCb.mock.calls.length).toEqual(3); // floatCb should not have been called again
  expect(floatCb2.mock.calls).toEqual([
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  ReactDOM.render(
    <FloatAnchor
      anchor={anchorRef =>
        <div ref={anchorRef}>foo<RenderCounter /></div>
      }
      float={null}
      zIndex={1337}
    />,
    mountPoint
  );
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(5);
  expect(getFloatRenderCount()).toBe(4);
  expect(document.querySelector('.floatedThing')).toBeFalsy();

  expect(floatCb.mock.calls.length).toEqual(3); // floatCb should not have been called again
  expect(floatCb2.mock.calls.length).toEqual(1); // floatCb2 should not have been called again

  ReactDOM.unmountComponentAtNode(mountPoint);
});
