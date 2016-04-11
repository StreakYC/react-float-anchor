/* @flow */

import fromEventsCapture from './lib/fromEventsCapture';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import React, {PropTypes} from 'react';
import ReactDOM, {findDOMNode} from 'react-dom';
import containByScreen from 'contain-by-screen';
import type {Options} from 'contain-by-screen';
import isEqual from 'lodash/isEqual';

export type FloatAnchorContext = {
  repositionEvents: Object;
};

type Props = {
  anchor: React.Element;
  float?: ?React.Element;
  options?: ?Options;
  zIndex?: ?number|string;
};
export default class FloatAnchor extends React.Component {
  props: Props;
  static propTypes = {
    options: PropTypes.object,
    anchor: PropTypes.element.isRequired,
    float: PropTypes.element
  };

  _portal: ?HTMLElement;
  _isRenderingFloat: boolean = false;
  _shouldRepositionOnFloatRender: boolean = false;
  _portalRemoval: Object = kefirBus();
  _unmount: Object = kefirBus();
  _repositionEvents: Object = kefirBus();

  // Context is used so that when a FloatAnchor has reposition() called on it,
  // all of its descendant FloatAnchor elements reposition too.
  static childContextTypes = {
    floatanchor: React.PropTypes.object
  };
  static contextTypes = {
    floatanchor: React.PropTypes.object
  };
  getChildContext(): Object {
    const floatanchor: FloatAnchorContext = {
      repositionEvents: this._repositionEvents
    };
    return {floatanchor};
  }

  _parentCtx(): ?FloatAnchorContext {
    return this.context.floatanchor;
  }

  componentDidMount() {
    this._updateFloat(this.props);
    const parentCtx = this._parentCtx();
    if (parentCtx) {
      parentCtx.repositionEvents
        .takeUntilBy(this._unmount)
        .onValue(() => this.reposition());
      this._repositionEvents.plug(parentCtx.repositionEvents);
    }
    // We need to reposition after the page has had its layout done.
    window.requestAnimationFrame(() => {
      this.reposition();
    });
  }

  componentWillReceiveProps(newProps: Props) {
    let forceReposition = !isEqual(newProps.options, this.props.options);
    if (
      forceReposition ||
      newProps.float !== this.props.float ||
      newProps.zIndex !== this.props.zIndex
    ) {
      this._updateFloat(newProps, forceReposition);
    }
  }

  componentWillUnmount() {
    this._portalRemoval.emit(null);
    this._unmount.emit(null);
    this._repositionEvents.end();
  }

  _updateFloat(props: Props, forceReposition: boolean=false) {
    const {float} = props;

    if (float) {
      let shouldReposition = forceReposition;
      if (!this._portal) {
        shouldReposition = true;
        const portal = this._portal = document.createElement('div');
        portal.style.zIndex = props.zIndex;
        portal.style.position = 'fixed';
        document.body.appendChild(portal);
        this._portalRemoval.take(1).onValue(() => {
          ReactDOM.unmountComponentAtNode(portal);
          portal.remove();
          this._portal = null;
        });
        const el = findDOMNode(this);
        Kefir.merge([
          Kefir.fromEvents(window, 'resize'),
          fromEventsCapture(window, 'scroll')
            .filter(event => event.target.contains(el))
        ])
          .takeUntilBy(this._portalRemoval)
          .onValue(() => {
            this.reposition();
          });
      }

      this._isRenderingFloat = true;
      (ReactDOM:any).unstable_renderSubtreeIntoContainer(
        this,
        float,
        this._portal,
        () => {
          this._isRenderingFloat = false;
          if (this._shouldRepositionOnFloatRender || shouldReposition) {
            this._shouldRepositionOnFloatRender = false;
            this.reposition();
          }
        }
      );
    } else {
      if (this._portal) {
        this._portalRemoval.emit(null);
      }
    }
  }

  reposition() {
    if (this._isRenderingFloat) {
      this._shouldRepositionOnFloatRender = true;
      return;
    }
    const portal = this._portal;
    if (portal) {
      containByScreen(portal, findDOMNode(this), this.props.options || {});
      this._repositionEvents.emit(null);
    }
  }

  render(): React.Element {
    const {anchor} = this.props;
    return anchor;
  }
}
