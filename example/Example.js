/* @flow */
/* eslint-disable no-console */

import * as React from 'react';
import FloatAnchor from '../src';

export default function Example(): React.Node {
  return (
    <div className="main">
      <div className="intro">
        <p>
          This is a demonstration of the{' '}
          <a href="https://github.com/StreakYC/react-float-anchor">
            react-float-anchor
          </a>{' '}
          library.
        </p>
        <p>
          The "Planets" and "Dwarf Planets" elements are each anchors that have
          floating elements aligned to them. The floating elements will
          reposition as necessary if the user scrolls or resizes the page.
        </p>
        <div>
          <FloatAnchor
            options={{ position: 'right', vAlign: 'top', hAlign: 'left' }}
            anchor={anchorRef => (
              <div
                style={{ border: '1px dashed gray', display: 'inline-block' }}
                ref={anchorRef}
              >
                Planets
              </div>
            )}
            float={
              <div style={{ border: '1px solid black', background: 'white' }}>
                Mercury
                <br />
                Venus
                <br />
                Earth
                <br />
                Mars
                <br />
                Jupiter
                <br />
                Saturn
                <br />
                Uranus
                <br />
                Neptune
                <br />
                <FloatAnchor
                  options={{ position: 'right', vAlign: 'top', hAlign: 'left' }}
                  anchor={anchorRef => (
                    <div ref={anchorRef}>Dwarf Planets ►</div>
                  )}
                  float={
                    <div
                      style={{ border: '1px solid black', background: 'white' }}
                    >
                      Ceres
                      <br />
                      Pluto
                      <br />
                      Eris
                    </div>
                  }
                />
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
