/* @flow */

import fromEventsWithOptions from './lib/fromEventsWithOptions';
import LifecycleHelper from './LifecycleHelper';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import type {Bus} from 'kefir-bus';
import * as React from 'react';
import {createPortal} from 'react-dom';
import PropTypes from 'prop-types';
import containByScreen from 'contain-by-screen';
import type {Options, Choice} from 'contain-by-screen';
import isEqual from 'lodash/isEqual';

const requestAnimationFrame = global.requestAnimationFrame || (cb => Promise.resolve().then(cb));

type FloatAnchorContextType = {
  // Emits an event after the component repositions, so the children can reposition themselves to match.
  repositionEvents: Kefir.Observable<null>,

  // Signifies this component has a repositionAsync queued up. Children components should ignore repositionAsync
  // calls while this is true. Children should copy their parent whenever their parent sets theirs to true.
  // Components should clear this flag when they reposition unless they have a parent with it still set.
  repositionAsyncQueued: boolean,

  // Emits every time repositionAsyncQueued becomes true.
  repositionAsyncEvents: Kefir.Observable<null>
};

type FloatAnchorOwnContextType = {
  repositionEvents: Bus<null, any>,
  repositionAsyncQueued: boolean,
  repositionAsyncEvents: Bus<null, any>
};

// Context is used so that when a FloatAnchor has reposition() called on it,
// all of its descendant FloatAnchor elements reposition too.
const FloatAnchorContext = React.createContext<?FloatAnchorContextType>(null);

export type {Options, Choice} from 'contain-by-screen';

export type Props = {
  anchor: ((anchorRef: React$Ref<any>) => React$Node) | HTMLElement;
  parentElement?: ?HTMLElement;
  float?: ?React$Node | ((choice: Choice | null) => React$Node);
  options?: ?Options;
  zIndex?: ?number|string;
  floatContainerClassName?: ?string;
};
type State = {
  choice: Choice | null;
  floatNode: ?React$Node;
};
export default class FloatAnchor extends React.Component<Props, State> {
  static propTypes = {
    anchor: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
    parentElement: PropTypes.object,
    float: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    options: PropTypes.object,
    zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    floatContainerClassName: PropTypes.string
  };

  static contextType: any = FloatAnchorContext;

  state: State = {
    choice: null,
    floatNode: null
  };

  _portalEl: ?HTMLElement;
  _portalRemoval: Bus<null> = kefirBus();
  _unmount: Bus<null> = kefirBus();
  _childContext: FloatAnchorOwnContextType = {
    repositionEvents: (kefirBus(): Bus<null>),
    repositionAsyncQueued: false,
    repositionAsyncEvents: (kefirBus(): Bus<null>)
  };

  static *parentNodes(node: Node): Iterator<Node> {
    do {
      yield (node: Node);
    } while ((node = (node: any).rfaAnchor || (node: any).parentNode));
  }

  // This property is only used in the case that props.anchor is not an HTMLElement
  _anchorRef: ?HTMLElement = null;

  _setAnchorRef: (anchorRef: ?HTMLElement) => void = (anchorRef: ?HTMLElement) => {
    this._anchorRef = anchorRef;

    const portalEl = this._portalEl;
    if (portalEl) {
      // rfaAnchor is also set in _mountPortal. This line is necessary in the case that
      // the anchorRef is updated.
      (portalEl: any).rfaAnchor = anchorRef ? anchorRef : undefined;
    }
  };
  _getAnchorRef(): ?HTMLElement {
    return typeof this.props.anchor === 'function' ? this._anchorRef : this.props.anchor;
  }

  _getOrCreatePortalEl(): HTMLElement {
    const portalEl_firstCheck = this._portalEl;
    if (portalEl_firstCheck) {
      return portalEl_firstCheck;
    }

    const portalEl = this._portalEl = document.createElement('div');
    portalEl.className = this.props.floatContainerClassName || '';
    portalEl.style.zIndex = String(this.props.zIndex);
    portalEl.style.position = 'fixed';

    return portalEl;
  }

  componentDidMount() {
    const parentCtx: ?FloatAnchorContextType = this.context;
    if (parentCtx) {
      parentCtx.repositionEvents
        .takeUntilBy(this._unmount)
        .onValue(() => this.reposition());

      parentCtx.repositionAsyncEvents
        .takeUntilBy(this._unmount)
        .onValue(() => {
          if (!this._childContext.repositionAsyncQueued) {
            this._childContext.repositionAsyncQueued = true;
            this._childContext.repositionAsyncEvents.value(null);
          }
        });

      if (parentCtx.repositionAsyncQueued) {
        this._childContext.repositionAsyncQueued = true;
        this._childContext.repositionAsyncEvents.value(null);
      }
    }

    if (this.state.floatNode != null) {
      // We need to reposition after the page has had its layout done.
      this.repositionAsync();
    }
  }

  static getDerivedStateFromProps(props: Props, state: State): $Shape<State> | null {
    return {
      floatNode: typeof props.float === 'function' ? props.float(state.choice) : props.float
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // If the only thing changed is state.choice *and* typeof props.float !== 'function', don't re-render.
    // If nothing has changed, allow the re-render so we keep the same behavior on a plain forceUpdate of a parent.
    // TODO in next major version, don't re-render when nothing has changed.
    if (
      typeof nextProps.float !== 'function' &&
      this.state.choice !== nextState.choice &&
      this.props.anchor === nextProps.anchor &&
      this.props.parentElement === nextProps.parentElement &&
      this.props.float === nextProps.float &&
      this.props.options === nextProps.options &&
      this.props.zIndex === nextProps.zIndex &&
      this.props.floatContainerClassName === nextProps.floatContainerClassName
    ) {
      return false;
    }
    return true;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const portalEl = this._portalEl;
    if (portalEl) {
      if (this.state.floatNode == null) {
        this._portalRemoval.value(null);
      } else {
        if (prevProps.parentElement !== this.props.parentElement) {
          this._portalRemoval.value(null);
          this._mountPortalEl();
        }
        if (prevProps.floatContainerClassName !== this.props.floatContainerClassName) {
          portalEl.className = this.props.floatContainerClassName || '';
        }
        if (prevProps.zIndex !== this.props.zIndex) {
          portalEl.style.zIndex = String(this.props.zIndex);
        }

        // If anchor is an HTMLElement and has changed, then update portalEl.rfaAnchor
        if (typeof this.props.anchor !== 'function' && prevProps.anchor !== this.props.anchor) {
          (portalEl: any).rfaAnchor = this.props.anchor;
          this.repositionAsync();
        } else if (
          // If this re-render happened because of a change in position choice, don't reposition again now.
          (prevState.floatNode !== this.state.floatNode && prevState.choice === this.state.choice) ||
          !isEqual(prevProps.options, this.props.options)
        ) {
          this.repositionAsync();
        }
      }
    } else {
      if (this.state.floatNode != null) {
        throw new Error('Should not happen: portalEl was null after rendering with float prop');
      }
    }
  }

  componentWillUnmount() {
    this._portalRemoval.value(null);
    this._unmount.value(null);
    this._childContext.repositionEvents.end();
    this._childContext.repositionAsyncEvents.end();
  }

  // Repositions on the next animation frame. Automatically batches with other repositionAsync calls
  // in the same tree.
  repositionAsync() {
    // If we already have a repositionAsync queued up, there's no reason to queue another.
    if (this._childContext.repositionAsyncQueued) {
      return;
    }
    this._childContext.repositionAsyncQueued = true;
    this._childContext.repositionAsyncEvents.value(null);

    requestAnimationFrame(() => {
      // If our parent still has a repositionAsync queued up, then don't fire.
      // The parent may have queued up a repositionAsync in the time since this repositionAsync() was called.
      const parentCtx: ?FloatAnchorContextType = this.context;
      if (!parentCtx || !parentCtx.repositionAsyncQueued) {
        // Make sure we still have a repositionAsync queued up. It could be that reposition() has been called
        // in the time since repositionAsync().
        if (this._childContext.repositionAsyncQueued) {
          this._childContext.repositionAsyncQueued = false;
          this.reposition();
        }
      }
    });
  }

  reposition() {
    // Only clear our repositionAsyncQueued flag if we're not reflecting our parent's true value.
    const parentCtx: ?FloatAnchorContextType = this.context;
    if (!parentCtx || !parentCtx.repositionAsyncQueued) {
      this._childContext.repositionAsyncQueued = false;
    }

    const portalEl = this._portalEl;
    const anchorRef = this._getAnchorRef();
    if (portalEl && portalEl.parentElement && anchorRef) {
      const choice = containByScreen(portalEl, anchorRef, this.props.options || {});
      if (!isEqual(this.state.choice, choice)) {
        this.setState({choice});
      }

      // Make any child FloatAnchors reposition
      this._childContext.repositionEvents.value(null);
    }
  }

  _mountPortalEl: () => void = () => {
    const portalEl = this._portalEl;
    /*:: if (!portalEl) throw new Error(); */
    if (portalEl.parentElement) {
      throw new Error('Should not happen: portalEl already in page');
    }

    const anchorRef = this._getAnchorRef();
    if (!anchorRef) throw new Error('ReactFloatAnchor missing anchorRef element');
    (portalEl: any).rfaAnchor = anchorRef;

    const target = this.props.parentElement || document.body || document.documentElement;
    /*:: if (!target) throw new Error(); */
    target.appendChild(portalEl);

    Kefir.merge([
      Kefir.fromEvents(window, 'resize'),
      fromEventsWithOptions(window, 'scroll', {
        capture: true,
        passive: true
      }).filter(event => {
        const anchorRef = this._getAnchorRef();
        return anchorRef && event.target.contains(anchorRef);
      })
    ])
      .takeUntilBy(this._portalRemoval)
      .onValue(() => {
        this.repositionAsync();
      })
      .onEnd(() => {
        (portalEl: any).rfaAnchor = undefined;
        /*:: if (!portalEl.parentElement) throw new Error(); */
        portalEl.parentElement.removeChild(portalEl);
      });
  };

  render(): React.Node {
    const {anchor} = this.props;
    const float = this.state.floatNode;
    let floatPortal = null;
    if (float != null) {
      const portalEl = this._getOrCreatePortalEl();
      floatPortal = (
        <FloatAnchorContext.Provider value={((this._childContext: any): FloatAnchorContextType)}>
          <LifecycleHelper onMount={this._mountPortalEl} />
          {createPortal(float, portalEl)}
        </FloatAnchorContext.Provider>
      );
    }

    const anchorElement = typeof anchor === 'function' ? anchor((this._setAnchorRef: any)) : null;

    return (
      <>
        {anchorElement}
        {floatPortal}
      </>
    );
  }
}
