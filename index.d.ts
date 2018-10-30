import * as React from 'react';

import {Options} from 'contain-by-screen';

export {Options} from 'contain-by-screen';

export type Props = {
  anchor: (anchorRef: React.Ref<any>) => React.ReactNode;
  float?: React.ReactNode | null | undefined;
  options?: Options | null | undefined;
  zIndex?: number | string | null | undefined;
  floatContainerClassName?: string | null | undefined;
};
export default class FloatAnchor extends React.Component<Props> {
  static parentNodes(node: Node): IterableIterator<Node>;
  reposition(): void;
}
