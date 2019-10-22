import * as React from 'react';

import {Options, Choice} from 'contain-by-screen';

export {Options, Choice} from 'contain-by-screen';

export type Props = {
  anchor: (anchorRef: React.Ref<any>) => React.ReactNode;
  float?: React.ReactNode | ((choice: Choice | null) => React.ReactNode) | null | undefined;
  options?: Options | null | undefined;
  zIndex?: number | string | null | undefined;
  floatContainerClassName?: string | null | undefined;
  parentElement?: HTMLElement;
};
export default class FloatAnchor extends React.Component<Props> {
  static parentNodes(node: Node): IterableIterator<Node>;
  repositionAsync(): void;
  reposition(): void;
}
