import { GeohashSet } from "geojake";
import * as React from "react";
import { LayerGroup } from "react-leaflet";
import { Geohash } from "./geohash";

export class Geohashes extends React.Component<IProps, IState> {
  render(): React.ReactNode {
    return (
      <LayerGroup>
        {Object.entries(this.props.geohashes).map(([key, value]) => {
          return (
            <Geohash
              key={key}
              hash={key}
              bounds={[
                [value.south, value.west],
                [value.north, value.east],
              ]}
            />
          );
        })}
      </LayerGroup>
    );
  }
}

interface IProps {
  geohashes: GeohashSet;
}

interface IState {}
