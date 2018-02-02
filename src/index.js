/* @flow */
/* eslint-disable react/no-find-dom-node */

import fromEventsWithOptions from './lib/fromEventsWithOptions';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import type {Bus} from 'kefir-bus';
import React from 'react';
import type {Element as ReactElement} from 'react';
import ReactDOM, {findDOMNode} from 'react-dom';
import PropTypes from 'prop-types';
import containByScreen from 'contain-by-screen';
import type {Options} from 'contain-by-screen';
import isEqual from 'lodash/isEqual';

const requestAnimationFrame = global.requestAnimationFrame || (cb => setTimeout(cb, 0));

export type FloatAnchorContext = {
  repositionEvents: Object;
};

export type {Options} from 'contain-by-screen';

type Props = {
  anchor: ReactElement<any>;
  float?: ?ReactElement<any>;
  options?: ?Options;
  zIndex?: ?number|string;
  className?: string; 
};
export default class FloatAnchor extends React.Component<Props> {
  static propTypes = {
    anchor: PropTypes.element.isRequired,
    float: PropTypes.element,
    options: PropTypes.object,
    zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string
  };

  _portalEl: ?HTMLElement;
  _portalRemoval: Bus<null> = kefirBus();
  _unmount: Bus<null> = kefirBus();
  _repositionEvents: Bus<null> = kefirBus();

  // Context is used so that when a FloatAnchor has reposition() called on it,
  // all of its descendant FloatAnchor elements reposition too.
  static childContextTypes = {
    floatanchor: PropTypes.object
  };
  static contextTypes = {
    floatanchor: PropTypes.object
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

  constructor(props: Props) {
    super(props);
    if (props.float) {
      this._portalEl = document.createElement('div');
      this._portalEl.className = props.className || 'floating-portal';
    } else {
      this._portalEl = null;
    }
  }

  componentDidMount() {
    this._updateFloat();
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
    if (newProps.float && !this._portalEl) {
      this._portalEl = document.createElement('div');
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this._portalEl && prevProps.anchor !== this.props.anchor) {
      (this._portalEl: any).rfaAnchor = findDOMNode(this);
    }

    if (
      prevProps.float !== this.props.float ||
      prevProps.zIndex !== this.props.zIndex
    ) {
      this._updateFloat();
      this.reposition();
    } else if (!isEqual(prevProps.options, this.props.options)) {
      this.reposition();
    }
  }

  componentWillUnmount() {
    this._portalRemoval.emit(null);
    this._unmount.emit(null);
    this._repositionEvents.end();
  }

  _updateFloat() {
    const {float} = this.props;

    if (float) {
      if (!this._portalEl) throw new Error('Should not happen: portalEl not initialized');
      const portalEl = this._portalEl;

      portalEl.style.zIndex = String(this.props.zIndex);
      portalEl.style.position = 'fixed';

      if (!portalEl.parentElement) {
        const el = findDOMNode(this);
        if (!el) throw new Error('ReactFloatAnchor missing element');
        const target = document.body || document.documentElement;
        if (!target) throw new Error('Could not find element to attach portal to');
        target.appendChild(portalEl);
        (portalEl: any).rfaAnchor = el;
        this._portalRemoval.take(1).onValue(() => {
          (portalEl: any).rfaAnchor = undefined;
          if (portalEl.parentElement) portalEl.parentElement.removeChild(portalEl);
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
    } else {
      if (this._portalEl && this._portalEl.parentElement) {
        this._portalRemoval.emit(null);
      }
    }
  }

  reposition() {
    const portalEl = this._portalEl;
    if (portalEl && portalEl.parentElement) {
      const el = findDOMNode(this);
      if (!(el instanceof HTMLElement)) throw new Error('ReactFloatAnchor missing element');
      containByScreen(portalEl, el, this.props.options || {});
      this._repositionEvents.emit(null);
    }
  }

  render() {
    const {anchor, float} = this.props;
    let floatPortal = null;
    if (float) {
      const portalEl = this._portalEl;
      if (!portalEl) throw new Error('Should not happen: portalEl not initialized');
      floatPortal = (ReactDOM:any).createPortal(float, portalEl);
    }

    // Using this small trick instead of an array so anchor and floatPortal
    // don't need keys. TODO Use <>...</> instead or whatever official fragment
    // technique React adds in the future.
    return (
      <div>
        {anchor}
        {floatPortal}
      </div>
    ).props.children;
  }
}
