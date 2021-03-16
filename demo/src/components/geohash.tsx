import { LatLngBoundsExpression } from "leaflet";
import * as React from "react";
import { Rectangle, Popup } from "react-leaflet";

export class Geohash extends React.Component<IProps, IState> {
  static PATH_OPTIONS = { fillColor: "blue", color: "blue" };
  render(): React.ReactNode {
    return (
      <Rectangle bounds={this.props.bounds} pathOptions={Geohash.PATH_OPTIONS}>
        <Popup className="geohashPop">{this.props.hash}</Popup>
      </Rectangle>
    );
  }
}

interface IProps {
  bounds: LatLngBoundsExpression;
  hash: string;
}

interface IState {}
