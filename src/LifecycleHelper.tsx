import {Component, ReactNode} from 'react';

interface Props {
  onMount(): void;
}

export default class LifecycleHelper extends Component<Props> {
  componentDidMount() {
    this.props.onMount();
  }
  render(): ReactNode {
    return null;
  }
}
