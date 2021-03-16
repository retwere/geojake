import { LatLngExpression, LatLngBounds } from "leaflet";
import * as React from "react";
import { LeafletMap } from "./leaflet_map";
import { DrawLayer } from "./draw_layer";

export class App extends React.Component<IProps, IState> {
  static DEFAULT_CENTER: LatLngExpression = [37.773972, -122.431297];
  static DEFAULT_GEOHASH_PRECISION: number = 3;
  static DEFAULT_ZOOM: number = 13;

  state: IState;

  constructor(props: IProps) {
    super(props);
    this.state = {
      precision: this.props.geohashPrecision
        ? this.props.geohashPrecision
        : App.DEFAULT_GEOHASH_PRECISION,
    };
  }

  render(): React.ReactNode {
    return (
      <LeafletMap
        center={this.props.center ? this.props.center : App.DEFAULT_CENTER}
        zoom={this.props.zoom ? this.props.zoom : App.DEFAULT_ZOOM}
      >
        <DrawLayer precision={this.state.precision} />
      </LeafletMap>
    );
  }
}

interface IProps {
  center?: LatLngExpression;
  geohashPrecision?: number;
  zoom?: number;
}

interface IState {
  precision: number;
}
