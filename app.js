/* global window */
import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {HexagonLayer} from 'deck.gl';

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

// Source data CSV
const DATA_URL = 'csv/h1995.csv'; // eslint-disable-line

export const INITIAL_VIEW_STATE = {
    longitude: 135,
    latitude: 35,
    zoom: 5.,
    minZoom: 1,
    maxZoom: 30,
    pitch: 45,
    bearing: 0
};

const LIGHT_SETTINGS = {
    lightsPosition: [135., 35, 10000.],
    // x1,y1,z1, x2,y2,z2
    ambientRatio: 1.,
    // 環境光の設定
    diffuseRatio: 0.7,
    // 拡散
    specularRatio: 0.7,
    // 反射
    lightsStrength: [0.7, 0],
    numberOfLights: 1
    // setting
    // https://github.com/uber/deck.gl/blob/master/docs/shader-modules/lighting.md
};

const colorRange = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

const elevationScale = {min: 0, max: 100};

/* eslint-disable react/no-deprecated */
export class App extends Component {
    static get defaultColorRange() {
        return colorRange;
    }

    constructor(props) {
        super(props);
        this.state = {
            elevationScale: elevationScale.min
        };

        this.startAnimationTimer = null;
        this.intervalTimer = null;

        this._startAnimate = this._startAnimate.bind(this);
        this._animateHeight = this._animateHeight.bind(this);
    }

    componentDidMount() {
        this._animate();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data && this.props.data && nextProps.data.length !== this.props.data.length) {
            this._animate();
        }
    }

    componentWillUnmount() {
        this._stopAnimate();
    }

    _animate() {
        this._stopAnimate();

        // wait 1.5 secs to start animation so that all data are loaded
        this.startAnimationTimer = window.setTimeout(this._startAnimate, 1500);
    }

    _startAnimate() {
        this.intervalTimer = window.setInterval(this._animateHeight, 20);
    }

    _stopAnimate() {
        window.clearTimeout(this.startAnimationTimer);
        window.clearTimeout(this.intervalTimer);
    }

    _animateHeight() {
        if (this.state.elevationScale === elevationScale.max) {
            this._stopAnimate();
        } else {
            this.setState({elevationScale: this.state.elevationScale + 1});
        }
    }

    _renderLayers() {
        const {data, radius = 200, upperPercentile = 100, coverage = 0.9} = this.props;

        return [
            new HexagonLayer({
                id: 'heatmap',
                colorRange,
                coverage,
                data,
                elevationRange: [0, 3000],
                elevationScale: this.state.elevationScale,
                extruded: true,
                getPosition: d => d,
                lightSettings: LIGHT_SETTINGS,
                onHover: this.props.onHover,
                opacity: 0.1,
                pickable: Boolean(this.props.onHover),
                radius: 100000, // radius of hex
                upperPercentile
            })
        ];
    }

    render() {
        const {viewState, controller = true, baseMap = true} = this.props;

        return (
            <DeckGL
                layers={this._renderLayers()}
                initialViewState={INITIAL_VIEW_STATE}
                viewState={viewState}
                controller={controller}
            >
                {baseMap && (
                    <StaticMap
                        reuseMaps
                        mapStyle="mapbox://styles/mapbox/dark-v9"
                        preventStyleDiffing={true}
                        mapboxApiAccessToken={MAPBOX_TOKEN}
                    />
                )}
            </DeckGL>
        );
    }
}

export function renderToDOM(container) {
    render(<App />, container);

    require('d3-request').csv(DATA_URL, (error, response) => {
        if (!error) {
            const data = response.map(d => [Number(d.lon)+Number(d.lon_min/60.),
                                            Number(d.lat)+Number(d.lat_min)/60.]);

            render(<App data={data} />, container);
        }
    });
}
