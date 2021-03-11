import * as React from "react";

export class App extends React.Component<IProps, Record<string, never>> {
  render(): React.ReactNode {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

interface IProps {
  name: string;
}
