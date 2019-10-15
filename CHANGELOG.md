## 3.2.0 (2019-10-15)

* Added the `parentElement` prop.

## 3.1.0 (2019-03-28)

* Added the `repositionAsync()` method to FloatAnchor. This method should generally be used instead of `reposition()` because it allows multiple queued repositions to be coalesced together.
* Fixed multiple O(n^2) issues with nested FloatAnchors that caused them to be repositioned redundantly when the outer FloatAnchors were repositioned.
* Fixed `autoFocus` prop not working on input elements and similar components inside of a floated element. The float element container div is now added to the page body before any of the float elements' componentDidMount methods are called.

## 3.0.0 (2018-10-30)

### Breaking Changes
* React v16.6.0+ is now required.
* The `anchor` prop must be a function of anchorRef => React node now.

FloatAnchor v2:

```js
<FloatAnchor
  anchor={
    <div>a</div>
  }
/>
```

FloatAnchor v3:

```js
<FloatAnchor
  anchor={anchorRef =>
    <div ref={anchorRef}>a</div>
  }
/>
```

### Improvements
* Removed all usages of the deprecated method
  [React.findDOMNode](https://reactjs.org/docs/react-dom.html#finddomnode).
* No longer uses the legacy [Context API](https://reactjs.org/docs/context.html#legacy-api).
* Both `anchor` and `float` props may now use any React node rather than only a
  React element. (You can pass a string now.)

## 2.2.1 (2018-10-29)

* Fixed compatibility with [Flow](https://flow.org/) v0.84.

## 2.2.0 (2018-09-24)

* Added TypeScript type definitions.
* Removed use of deprecated React method `componentWillReceiveProps`.

## 2.1.0 (2018-02-02)

* Added floatContainerClassName prop [#3](https://github.com/StreakYC/react-float-anchor/pull/3)

## 2.0.0 (2017-10-02)

### Breaking Changes
* React v16 is now required.
* FloatAnchor.portal property was removed.

## 1.5.1 (2018-08-31)

* Fixed compatibility with [Flow](https://flow.org/) v0.80.

## 1.5.0 (2017-08-23)

* Fixed compatibility with [Flow](https://flow.org/) v0.53.

## 1.4.3 (2017-07-11)

* Stopped publishing tests to npm.

## 1.4.2 (2017-07-11)

* Fixed IE compatibility [#2](https://github.com/StreakYC/react-float-anchor/issues/2)

## 1.4.1 (2017-04-25)

* Fixed a few missed deprecated React.PropTypes usages.

## 1.4.0 (2017-04-25)

* Use new prop-types package and stopped using deprecated React.PropTypes.

## 1.3.7 (2017-03-06)

* Fixed compatibility with [Flow](https://flow.org/) v0.41.

## 1.3.6 (2017-01-24)

* Fixed compatibility with [Flow](https://flow.org/) v0.38.

## 1.3.5 (2016-12-09)

* Fixed an error when importing FloatAnchor in non-browser environments (such as tests).

## 1.3.4 (2016-09-13)

* Fixed compatibility with [Flow](https://flow.org/) v0.32.

## 1.3.3 (2016-09-02)

* Fixed issue with FloatAnchor.parentNodes when called after anchor element changed.

## 1.3.2 (2016-08-05)

* (Flow) Re-export the Options type from contain-by-screen to be used by consumers.

## 1.3.1 (2016-08-05)

* Fixed compatibility with [Flow](https://flow.org/) v0.30.

## 1.3.0 (2016-06-07)

* Added FloatAnchor.parentNodes function.

## 1.2.1 (2016-05-10)

* Use passive scroll events to allow browser optimizations.

## 1.2.0 (2016-04-12)

* Added portal property to component instance.

## 1.1.0 (2016-04-11)

* Added zIndex prop.

## 1.0.1 (2016-04-07)

* Changed peerDependencies to mark compatibility with React 15.

## 1.0.0 (2016-03-30)

Initial stable release.
