import { LatLngExpression } from "leaflet";
import * as React from "react";
import { Map as MapContainer, TileLayer } from "react-leaflet";

export class LeafletMap extends React.Component<IProps, IState> {
  render(): React.ReactNode {
    return (
      <MapContainer
        center={this.props.center}
        zoom={this.props.zoom}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {this.props.children}
      </MapContainer>
    );
  }
}

interface IProps {
  center: LatLngExpression;
  zoom: number;
}

interface IState {}
