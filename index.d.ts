import * as React from 'react';

import {Options} from 'contain-by-screen';

export {Options} from 'contain-by-screen';

export type Props = {
  anchor: React.ReactElement<any>;
  float?: React.ReactElement<any> | null | undefined;
  options?: Options | null | undefined;
  zIndex?: number | string | null | undefined;
  floatContainerClassName?: string | null | undefined;
};
export default class FloatAnchor extends React.Component<Props> {
}
