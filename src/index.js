/* @flow */

import fromEventsWithOptions from './lib/fromEventsWithOptions';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import type {Bus} from 'kefir-bus';
import React, {PropTypes} from 'react';
import ReactDOM, {findDOMNode} from 'react-dom';
import containByScreen from 'contain-by-screen';
import type {Options} from 'contain-by-screen';
import isEqual from 'lodash/isEqual';

const requestAnimationFrame = global.requestAnimationFrame || (cb => setTimeout(cb, 0));

export type FloatAnchorContext = {
  repositionEvents: Object;
};

export type {Options} from 'contain-by-screen';

type Props = {
  anchor: React.Element<any>;
  float?: ?React.Element<any>;
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

  _portalEl: ?HTMLElement;
  _isRenderingFloat: boolean = false;
  _shouldRepositionOnFloatRender: boolean = false;
  _portalRemoval: Bus<null> = kefirBus();
  _unmount: Bus<null> = kefirBus();
  _repositionEvents: Bus<null> = kefirBus();

  // The floated component. Exposed for test purposes.
  portal: ?React.Component<any,any,any> = null;

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

  static *parentNodes(node: Node) {
    do {
      yield (node: Node);
    } while ((node = (node: any).rfaAnchor || (node: any).parentNode));
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
    requestAnimationFrame(() => {
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

  componentDidUpdate(prevProps: Props) {
    if (this._portalEl && prevProps.anchor !== this.props.anchor) {
      (this._portalEl: any).rfaAnchor = findDOMNode(this);
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
      if (!this._portalEl) {
        shouldReposition = true;
        const el = findDOMNode(this);
        if (!el) throw new Error('ReactFloatAnchor missing element');
        const portalEl = this._portalEl = document.createElement('div');
        portalEl.style.zIndex = String(props.zIndex);
        portalEl.style.position = 'fixed';
        const target = document.body || document.documentElement;
        if (!target) throw new Error('Could not find element to attach portal to');
        target.appendChild(portalEl);
        (portalEl: any).rfaAnchor = el;
        this._portalRemoval.take(1).onValue(() => {
          (portalEl: any).rfaAnchor = undefined;
          this.portal = null;
          ReactDOM.unmountComponentAtNode(portalEl);
          portalEl.remove();
          this._portalEl = null;
        });
        Kefir.merge([
          Kefir.fromEvents(window, 'resize'),
          fromEventsWithOptions(window, 'scroll', {capture: true, passive: true})
            .filter(event => event.target.contains(el))
        ])
          .takeUntilBy(this._portalRemoval)
          .onValue(() => {
            this.reposition();
          });
      }

      this._isRenderingFloat = true;
      this.portal = (ReactDOM:any).unstable_renderSubtreeIntoContainer(
        this,
        float,
        this._portalEl,
        () => {
          this._isRenderingFloat = false;
          if (this._shouldRepositionOnFloatRender || shouldReposition) {
            this._shouldRepositionOnFloatRender = false;
            this.reposition();
          }
        }
      );
    } else {
      if (this._portalEl) {
        this._portalRemoval.emit(null);
      }
    }
  }

  reposition() {
    if (this._isRenderingFloat) {
      this._shouldRepositionOnFloatRender = true;
      return;
    }
    const portalEl = this._portalEl;
    if (portalEl) {
      const el = findDOMNode(this);
      if (!(el instanceof HTMLElement)) throw new Error('ReactFloatAnchor missing element');
      containByScreen(portalEl, el, this.props.options || {});
      this._repositionEvents.emit(null);
    }
  }

  render() {
    const {anchor} = this.props;
    return anchor;
  }
}
