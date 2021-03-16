import { Box, Geohashes as GH, GeohashSet } from "geojake";
import { Util } from "leaflet";
import { DrawEvents, Layer, Rectangle } from "leaflet";
import * as React from "react";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Geohashes } from "./geohashes";

export class DrawLayer extends React.Component<IProps, IState> {
  static PATH_OPTIONS = { color: "black" };
  state: IState = {};

  render(): React.ReactNode {
    return (
      <>
        <FeatureGroup>
          <EditControl
            position="topleft"
            onEdited={this._onEdit.bind(this)}
            onCreated={this._onCreate.bind(this)}
            onDeleted={this._onDelete.bind(this)}
            onEditStart={this._sendDrawnToFront.bind(this)}
            onEditStop={this._sendDrawnToBack.bind(this)}
            onDeleteStart={this._sendDrawnToFront.bind(this)}
            onDeleteStop={this._sendDrawnToBack.bind(this)}
            draw={{
              polyline: false,
              polygon: false,
              circle: false,
              circlemarker: false,
              rectangle: {
                shapeOptions: DrawLayer.PATH_OPTIONS,
              },
              marker: false,
            }}
          />
        </FeatureGroup>
        {Object.entries(this.state).map(([key, value]) => {
          if (!value) return;
          return (
            <Geohashes key={key} geohashes={value.geohashes as GeohashSet} />
          );
        })}
      </>
    );
  }

  _sendDrawnToBack() {
    for (let [key, value] of Object.entries(this.state)) {
      if (value && value.layer) {
        value.layer.bringToBack();
      }
    }
  }

  _sendDrawnToFront() {
    for (let [key, value] of Object.entries(this.state)) {
      if (value && value.layer) {
        value.layer.bringToFront();
      }
    }
  }

  _onEdit(e: DrawEvents.Edited) {
    let newState: IState = {};
    e.layers.eachLayer((l) => {
      if (l instanceof Rectangle) {
        const rect = (l as Rectangle).getBounds();
        const box = new Box([
          rect.getSouth(),
          rect.getWest(),
          rect.getNorth(),
          rect.getEast(),
        ]);
        const geohashes = new GH(box, this.props.precision);
        newState[Util.stamp(l)] = { layer: l, geohashes: geohashes.all };
      }
    });
    this.setState(newState);
  }

  _onCreate(e: DrawEvents.Created) {
    if (e.layerType === "rectangle") {
      const rect = (e.layer as Rectangle).getBounds();
      let box = new Box([
        rect.getSouth(),
        rect.getWest(),
        rect.getNorth(),
        rect.getEast(),
      ]);
      let geohashes = new GH(box, this.props.precision);
      let newState: IState = {};
      newState[Util.stamp(e.layer)] = {
        layer: e.layer,
        geohashes: geohashes.all,
      };
      this.setState(newState);
    }
  }

  _onDelete(e: DrawEvents.Deleted) {
    let newState: IState = {};
    e.layers.eachLayer((l) => {
      newState[Util.stamp(l)] = null;
    });
    this.setState(newState);
  }
}

interface IProps {
  precision: number;
}

interface IState {
  [boxId: number]: { layer: Layer; geohashes: GeohashSet } | null;
}
