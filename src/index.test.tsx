/**
 * @jest-environment jsdom
 */

import * as sinon from 'sinon';
import sinonTestFactory from 'sinon-test';
const sinonTest = sinonTestFactory(sinon);
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import * as TestUtils from 'react-dom/test-utils';
import * as ReactTestRenderer from 'react-test-renderer';
import FloatAnchor from '.';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

function makeRenderCounter() {
  let renderCount = 0;
  function getRenderCount(): number {
    return renderCount;
  }
  function RenderCounter() {
    renderCount++;
    return <></>;
  }
  return {getRenderCount, RenderCounter};
}

beforeEach(() => {
  document.body.textContent = '';
});

test('mounts', sinonTest(function(this: any) {
  // TODO test resize and scroll handlers
  this.spy(window, 'addEventListener');
  this.spy(window, 'removeEventListener');
  this.stub(window, 'requestAnimationFrame');

  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo</div>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />
    );
  });

  const divs = TestUtils.scryRenderedDOMComponentsWithTag(rootRFA.current!, 'div');

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

  expect((floatParent as any).rfaAnchor).toBe(foo);

  const floatContainer = float.parentElement;
  if (!(floatContainer instanceof HTMLElement)) throw new Error('Failed to find container');
  expect(floatContainer.style.zIndex).toBe('1337');

  act(() => root.unmount());

  expect(document.querySelector('.floatedThing')).toBe(null);
  expect((floatParent as any).rfaAnchor).toBe(undefined);
}));

test('rfaAnchor updates if anchor element changes', () => {
  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo</div>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />
    );
  });

  const divs = TestUtils.scryRenderedDOMComponentsWithTag(rootRFA.current!, 'div');
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

  expect((floatParent as any).rfaAnchor).toBe(foo);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <p ref={anchorRef}>bar</p>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />
    );
  });

  const ps = TestUtils.scryRenderedDOMComponentsWithTag(rootRFA.current!, 'p');
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

  expect((floatParent as any).rfaAnchor).toBe(bar);

  act(() => root.unmount());
});

test('float can be added and removed', async () => {
  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const {getRenderCount, RenderCounter} = makeRenderCounter();

  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={null}
        zIndex={1337}
      />
    );
  });
  await act(waitForAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(1);
  expect(document.querySelector('.floatedThing')).toBeFalsy();

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={
          <div className="floatedThing">blah</div>
        }
        zIndex={1337}
      />
    );
  });
  await act(waitForAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(2);
  const floatedThing = document.querySelector('.floatedThing');
  if (!floatedThing) throw new Error('missing floatedThing');

  const floatedThingParent = floatedThing.parentElement;
  if (!floatedThingParent) throw new Error();

  expect(document.contains(floatedThingParent)).toBe(true);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={null}
        zIndex={1337}
      />
    );
  });
  await act(waitForAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(3);
  expect(document.querySelector('.floatedThing')).toBeFalsy();
  expect(document.contains(floatedThingParent)).toBe(false);

  act(() => root.unmount());
});

test('can add a (custom) class to the portal', () => {
  const mountPoint = document.createElement('div');
  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        floatContainerClassName='my-floating-container'
        anchor={anchorRef => <div ref={anchorRef}>foo</div>}
        float={'abc'}
        zIndex={1337}
      />
    );
  });

  expect(document.querySelector('.my-floating-container')).toBeTruthy();

  act(() => root.unmount());
});

test('supports HTMLElement as anchor', () => {
  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const anchor = document.createElement('div');
  const anchor2 = document.createElement('div');
  document.body.appendChild(anchor);
  document.body.appendChild(anchor2);

  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchor}
        float={
          <div className="floatedThing">blah</div>
        }
      />
    );
  });

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

  expect((floatParent as any).rfaAnchor).toBe(anchor);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchor2}
        float={
          <div className="floatedThing">blah</div>
        }
      />
    );
  });

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

  expect((floatParent as any).rfaAnchor).toBe(anchor2);

  // switch anchor from HTMLElement to a React element
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef => <div id="foo" ref={anchorRef}>foo</div>}
        float={
          <div className="floatedThing">blah</div>
        }
      />
    );
  });

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

  expect((floatParent as any).rfaAnchor).toBe(foo);

  // switch anchor back to HTMLElement
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchor}
        float={
          <div className="floatedThing">blah</div>
        }
      />
    );
  });

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

  expect((floatParent as any).rfaAnchor).toBe(anchor);

  act(() => root.unmount());
  anchor.remove();
  anchor2.remove();
});

test('supports parentElement', () => {
  const mountPoint = document.createElement('div');
  const parentElement = document.createElement('div');

  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
        float={<div className="float">float</div>}
        parentElement={parentElement}
      />
    );
  });

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement.querySelector('.float')).toBeTruthy();

  act(() => root.unmount());
});

test('supports changing parentElement', () => {
  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const parentElement1 = document.createElement('div');
  const parentElement2 = document.createElement('div');

  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
        float={<div className="float">float</div>}
        parentElement={parentElement1}
      />
    );
  });

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement1.querySelector('.float')).toBeTruthy();
  expect(parentElement2.querySelector('.float')).toBe(null);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
        float={<div className="float">float</div>}
        parentElement={parentElement2}
      />
    );
  });

  expect(document.querySelector('.float')).toBe(null);
  expect(parentElement1.querySelector('.float')).toBe(null);
  expect(parentElement2.querySelector('.float')).toBeTruthy();

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef => <div className="anchor" ref={anchorRef}>foo</div>}
        float={<div className="float">float</div>}
      />
    );
  });

  expect(document.querySelector('.float')).toBeTruthy();
  expect(parentElement1.querySelector('.float')).toBe(null);
  expect(parentElement2.querySelector('.float')).toBe(null);

  act(() => root.unmount());
});

test('works with react-test-renderer without float', () => {
  // Doesn't work in react-test-renderer when float prop is non-null, partly
  // because https://github.com/facebook/react/issues/11565
  const component = ReactTestRenderer.create(
    <FloatAnchor
      floatContainerClassName='my-floating-container'
      anchor={anchorRef => <div ref={anchorRef}>foo</div>}
      float={null}
      zIndex={1337}
    />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  component.unmount();
});

test('element is in DOM during componentDidMount', () => {
  let wasInDomDuringMount = null;

  class MountTester extends React.Component {
    private _ref = React.createRef<HTMLDivElement>();

    componentDidMount() {
      wasInDomDuringMount =
        document.body.contains(this._ref.current) &&
        document.querySelector('.element-in-dom-test') != null;
    }

    render() {
      return <div ref={this._ref}>foo</div>;
    }
  }

  const mountPoint = document.createElement('div');


  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        floatContainerClassName="element-in-dom-test"
        anchor={anchorRef => <div ref={anchorRef}>foo</div>}
        float={<MountTester />}
        zIndex={1337}
      />
    );
  });

  expect(wasInDomDuringMount).toBe(true);

  act(() => root.unmount());
});

test('float choice callback works', async () => {
  const rootRFA = React.createRef<FloatAnchor>();

  const mountPoint = document.createElement('div');
  const {getRenderCount, RenderCounter} = makeRenderCounter();
  const {getRenderCount: getFloatRenderCount, RenderCounter: FloatRenderCounter} = makeRenderCounter();
  const floatCb = jest.fn(choice => <div className="floatedThing">blah<FloatRenderCounter /></div>);

  const root = createRoot(mountPoint);
  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={floatCb}
        zIndex={1337}
      />
    );
  });
  await act(waitForAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(2);
  expect(getFloatRenderCount()).toBe(2);
  expect(document.querySelector('.floatedThing')).toBeTruthy();
  expect(document.querySelector('.floatedThing')!.textContent).toBe('blah');

  expect(floatCb.mock.calls).toEqual([
    [null],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={floatCb}
        zIndex={1337}
      />
    );
  });
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(3);
  expect(getFloatRenderCount()).toBe(3);
  expect(floatCb.mock.calls).toEqual([
    [null],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}],
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  const floatCb2 = jest.fn(choice => <div className="floatedThing">blah2<FloatRenderCounter /></div>);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={floatCb2}
        zIndex={1337}
      />
    );
  });
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(4);
  expect(getFloatRenderCount()).toBe(4);
  expect(document.querySelector('.floatedThing')).toBeTruthy();
  expect(document.querySelector('.floatedThing')!.textContent).toBe('blah2');

  expect(floatCb.mock.calls.length).toEqual(3); // floatCb should not have been called again
  expect(floatCb2.mock.calls).toEqual([
    [{position: 'top', hAlign: 'center', vAlign: 'center'}]
  ]);

  act(() => {
    root.render(
      <FloatAnchor
        ref={rootRFA}
        anchor={anchorRef =>
          <div ref={anchorRef}>foo<RenderCounter /></div>
        }
        float={null}
        zIndex={1337}
      />
    );
  });
  await new Promise(requestAnimationFrame); // wait for asynchronous reposition

  expect(getRenderCount()).toBe(5);
  expect(getFloatRenderCount()).toBe(4);
  expect(document.querySelector('.floatedThing')).toBeFalsy();

  expect(floatCb.mock.calls.length).toEqual(3); // floatCb should not have been called again
  expect(floatCb2.mock.calls.length).toEqual(1); // floatCb2 should not have been called again

  act(() => root.unmount());
});
