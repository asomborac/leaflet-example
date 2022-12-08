/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents, Polyline, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import styles from './MapComponent.module.css';
import Exporter from './Exporter';
import Geoman from './Geoman';
import town from './town.json';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import { calculateArea } from './MapUtils';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useDidUpdateEffect } from './useDidUpdateEffect';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

export default function MapComponent() {
    const [exporter, setExporter] = useState(false);
    const [mapState, setMapState] = useState(null);
    const [featurePolygon, setFeaturePolygon] = useState(null);
    const [polygons, setPolygons] = useState([]);
    const [clickPosition, setClickPosition] = useState([]);

    const [name, setName] = useState('');
    const [color, setColor] = useState('');

    const [townVisible, setTownVisible] = useState(true);
    const [routeVisible, setRouteVisible] = useState(false);
    const [openStreetMapVisible, setOpenStreetMapVisible] = useState(false);
    const [googleVisible, setGoogleVisible] = useState(true);

    const [cloudsVisible, setCloudsVisible] = useState(false);
    const [precipitationVisible, setPrecipitationVisible] = useState(false);
    const [temperatureVisible, setTemperatureVisible] = useState(false);
    const [windVisible, setWindVisible] = useState(false);
    const [pressureVisible, setPressureVisible] = useState(false);

    const [myLocation, setMyLocation] = useState([]);
    const [myLocationVisible, setMyLocationVisible] = useState(false);
    const [sentinelVisible, setSentinelVisible] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [polygonsVisible, setPolygonsVisible] = useState(true);

    const handleExporter = () => setExporter(!exporter);
    const handleMapState = (state) => setMapState(state);

    const handleName = (e) => setName(e.target.value);
    const handleColor = (e) => setColor(e.target.value);

    const toggleTownVisible = () => setTownVisible(!townVisible);
    const toggleRouteVisible = () => setRouteVisible(!routeVisible);
    const handleMyLocationVisible = () => setMyLocationVisible(!myLocationVisible);
    const toggleSentinelVisible = () => setSentinelVisible(!sentinelVisible);
    const handleDialogVisible = () => setDialogVisible(!dialogVisible);
    const togglePolygonsVisible = () => setPolygonsVisible(!polygonsVisible);

    const toggleCloudsVisible = () => setCloudsVisible(!cloudsVisible);
    const togglePrecipitationVisible = () => setPrecipitationVisible(!precipitationVisible);
    const toggleTemperatureVisible = () => setTemperatureVisible(!temperatureVisible);
    const toggleWindVisible = () => setWindVisible(!windVisible);
    const togglePressureVisible = () => setPressureVisible(!pressureVisible);

    const toggleBaseLayer = () => {
        setOpenStreetMapVisible(!openStreetMapVisible);
        setGoogleVisible(!googleVisible);
    };

    const handlePolygons = (polygon) => {
        let area = calculateArea(polygon);
        setFeaturePolygon({ polygon, area });
        handleDialogVisible();
    };

    const position = [45.25, 19.394];

    const savePolygon = () => {
        let coordinates = featurePolygon.polygon[0].map(item => [item.lng, item.lat]);
        let hexColor = isHexColor(color) ? color : '4692fb';

        const geoData = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        name: name,
                        area: featurePolygon.area,
                        color: "#" + hexColor,
                        type: "userPolygon"
                    },
                    geometry: {
                        coordinates: [coordinates],
                        type: "Polygon"
                    }
                }
            ]
        }
        setPolygons(old => [...old, geoData]);
        handleDialogVisible();
    };

    useDidUpdateEffect(() => {
        if (mapState) {
            resetInputs();
            removePolygons();
            loadPolygons();
        }
    }, [polygons]);

    useDidUpdateEffect(() => {
        if (polygonsVisible) loadPolygons();
        else removePolygons();
    }, [polygonsVisible]);

    const loadPolygons = () => {
        polygons.forEach(polygon => {
            L.geoJSON(polygon).addTo(mapState)
        });

        if (mapState) {
            mapState.eachLayer(layer => {
                if (layer.feature && layer.feature.properties.type === "userPolygon") {
                    let polygonColor = layer.feature.properties.color;
                    layer.setStyle({
                        fillColor: polygonColor,
                        fillOpacity: 0.2,
                        color: polygonColor,
                        weight: 3
                    });

                    layer.on('mouseover', (e) => { layer.setStyle({ color: polygonColor, opacity: 1, fillColor: polygonColor, fillOpacity: 0.4, weight: 3 }); });
                    layer.on('mouseout', (e) => { layer.setStyle({ color: polygonColor, opacity: 1, fillColor: polygonColor, fillOpacity: 0.2, weight: 3 }); });

                    const popup = L.popup().setContent(`
                    <p style="text-align: center;font-size:16px;font-family:roboto; overflow-wrap:anywhere">
                        Name: ${layer.feature.properties.name}
                        <p style="font-size:16px;font-family:roboto">Area: ${(layer.feature.properties.area / 100).toFixed(2)} km<sup>2</sup></p>
                    </p>`
                    );
                    layer.bindPopup(popup);
                }
            });
        }
    };

    const isHexColor = (hex) => {
        return typeof hex === 'string'
            && hex.length === 6
            && !isNaN(Number('0x' + hex))
    };

    const cancelPolygon = () => {
        resetInputs();
        removePolygons();
        handleDialogVisible();
    };

    const resetInputs = () => {
        setName('');
        setColor('');
    };

    useEffect(() => handleExporter(), []);

    const styleGeoJson = () => {
        return {
            weight: 2,
            opacity: 1,
            dashArray: '3',
            fillOpacity: 0.2,
            color: 'red',
        };
    };

    const LocationFinder = () => {
        useMapEvents({
            click(e) {
                setClickPosition([
                    Math.round(e.latlng.lat * 100) / 100,
                    Math.round(e.latlng.lng * 100) / 100,
                ]);
            },
        });
        return null;
    };

    const whereAmI = () => {
        navigator.geolocation.getCurrentPosition((position) => {
            setMyLocation([position.coords.latitude, position.coords.longitude]);
        });
        handleMyLocationVisible();
    };

    const logLayers = () => mapState.eachLayer(layer => console.log(layer));
    const removePolygons = () => {
        if (mapState) {
            mapState?.eachLayer(layer => {
                if (layer?.feature?.properties?.type === "userPolygon") {
                    mapState.removeLayer(layer);
                }
                if (layer._latlngs && layer.feature === undefined && layer.options?.feature !== "Polyline") {
                    mapState.removeLayer(layer);
                }
            });
        }
    };

    const removeAllLayers = () => {
        if (mapState) {
            mapState?.eachLayer(layer => {
                mapState.removeLayer(layer);
            });
        }
    };

    const polyline = [
        [45.250744132795816, 19.386292317519857],
        [45.24997347696499, 19.38622282532965],
        [45.250010694479585, 19.38452747684242],
        [45.24806638513649, 19.38440947514968],
        [45.24828535922317, 19.38210844214179],
        [45.24848923088986, 19.382140624421623],
        [45.248462803122486, 19.382242534974424],
    ];

    const geonjsonio = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "coordinates": [
                        [
                            [
                                19.25389350419607,
                                46.758112594931816
                            ],
                            [
                                19.028676493491503,
                                46.461575282506146
                            ],
                            [
                                19.564907471359135,
                                46.41353498924849
                            ],
                            [
                                19.653385582707187,
                                46.70665750379084
                            ],
                            [
                                19.417443952445268,
                                46.8260315298528
                            ],
                            [
                                19.25389350419607,
                                46.758112594931816
                            ]
                        ]
                    ],
                    "type": "Polygon"
                }
            },
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "coordinates": [
                        [
                            19.505922070755588,
                            46.84987460315284
                        ],
                        [
                            19.715052152123633,
                            46.743416160697564
                        ],
                        [
                            19.60780595655058,
                            46.3580512615234
                        ],
                        [
                            18.94287954399522,
                            46.40983783882763
                        ]
                    ],
                    "type": "LineString"
                }
            }
        ]
    }

    const route = <div>
        <Marker position={[45.250744132795816, 19.386292317519857]} />
        <Polyline positions={polyline} feature="Polyline" />
        <Marker position={[45.248462803122486, 19.382242534974424]} />
    </div>

    const mapContainer = <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        doubleClickZoom={false}
    >
        <Exporter exporter={exporter} handleMapState={handleMapState} />
        <Geoman handlePolygons={handlePolygons} mapState={mapState} />

        {openStreetMapVisible && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />}
        {googleVisible &&
            <ReactLeafletGoogleLayer
                attribution='<a href="https://developers.google.com/maps/terms">Terms of Use.</a>'
                apiKey='AIzaSyBuZJYdqpIR_vERdvSmk0zNRrCQMBiMaz0'
                type={'hybrid'}
            />}

        {cloudsVisible && <TileLayer url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=93228e7b0331d7c46e915eb2053842e1" />}
        {precipitationVisible && <TileLayer url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=93228e7b0331d7c46e915eb2053842e1" />}
        {temperatureVisible && <TileLayer url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=93228e7b0331d7c46e915eb2053842e1" />}
        {windVisible && <TileLayer url="https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=93228e7b0331d7c46e915eb2053842e1" />}
        {pressureVisible && <TileLayer url="https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=93228e7b0331d7c46e915eb2053842e1" />}

        {myLocation.length > 0 && myLocationVisible && <Marker position={myLocation} />}
        {sentinelVisible &&
            <WMSTileLayer
                url={"https://services.sentinel-hub.com/ogc/wms/0689fc45-203e-458b-81d7-0a53c762f979"}
                format={"image/jpeg"}
                maxcc={20}
                zIndex={2100}
                layers={'NDVI'}
                showLogo={false}
                time="2022-07-07"
            />
        }
        {townVisible && <GeoJSON data={town} style={styleGeoJson} feature="townPolygon">
            <Popup>
                Town
                <button onClick={() => { mapState.flyTo(position) }}>fly</button>
            </Popup>
        </GeoJSON>}
        {routeVisible && route}
        <LocationFinder />
    </MapContainer>

    return (
        <div>
            <Dialog
                visible={dialogVisible}
                header="Polygon properties"
                modal={true}
                className={styles.dialog}
                onHide={handleDialogVisible}
                position="top"
                draggable={false}
            >
                <div className={styles.dialogContent}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={handleName}
                        className={styles.input}
                    />
                    <input
                        type="text"
                        placeholder="Color"
                        value={color}
                        onChange={handleColor}
                        className={styles.input}
                    />
                    <div className={styles.buttonContainer}>
                        <Button label="Cancel" className={styles.button} onClick={cancelPolygon} />
                        <Button label="Save" className={styles.button} onClick={savePolygon} />
                    </div>
                </div>
            </Dialog>
            <div className={styles.container}>
                {mapContainer}
                <div className={styles.sideBar}>
                    <div className={styles.sideBarContent}>
                        <div className={styles.title}>
                            Base Raster Layers
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleBaseLayer}>
                            Google maps
                            <input
                                type="radio"
                                className={styles.checkbox}
                                value={googleVisible}
                                onChange={toggleBaseLayer}
                                checked={googleVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleBaseLayer}>
                            Open Street Map
                            <input
                                type="radio"
                                className={styles.checkbox}
                                value={openStreetMapVisible}
                                onChange={toggleBaseLayer}
                                checked={openStreetMapVisible}
                            />
                        </div>

                        <br />
                        <div className={styles.title}>Vector layers</div>
                        <div className={styles.sideBarRow} onClick={toggleTownVisible}>
                            Town GeoJSON
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                onChange={toggleTownVisible}
                                checked={townVisible}
                                value={townVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={togglePolygonsVisible}>
                            Polygons
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                onChange={togglePolygonsVisible}
                                checked={polygonsVisible}
                                value={polygonsVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleRouteVisible}>
                            Walking route
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                onChange={toggleRouteVisible}
                                checked={routeVisible}
                                value={routeVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={whereAmI}>
                            Where am I?
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                onChange={whereAmI}
                                checked={myLocationVisible}
                                value={myLocationVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleSentinelVisible}>
                            Sentinel - NDMI
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                onChange={toggleSentinelVisible}
                                checked={sentinelVisible}
                                value={sentinelVisible}
                            />
                        </div>

                        <br />
                        <div className={styles.title}>
                            Weather Raster layers
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleCloudsVisible}>
                            Clouds
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                value={cloudsVisible}
                                onChange={toggleCloudsVisible}
                                checked={cloudsVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={togglePrecipitationVisible}>
                            Precipitation
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                value={precipitationVisible}
                                onChange={togglePrecipitationVisible}
                                checked={precipitationVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleTemperatureVisible}>
                            Temperature
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                value={temperatureVisible}
                                onChange={toggleTemperatureVisible}
                                checked={temperatureVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={toggleWindVisible}>
                            Wind
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                value={windVisible}
                                onChange={toggleWindVisible}
                                checked={windVisible}
                            />
                        </div>
                        <div className={styles.sideBarRow} onClick={togglePressureVisible}>
                            Pressure
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                value={pressureVisible}
                                onChange={togglePressureVisible}
                                checked={pressureVisible}
                            />
                        </div>

                        <br />
                        <div className={styles.title}>Functions</div>
                        <div className={styles.sideBarRow} onClick={logLayers}>Log layers</div>
                        <div className={styles.sideBarRow} onClick={removeAllLayers}>Remove all layers</div>
                        {clickPosition.length > 0 &&
                            <div className={styles.sideBarRow}>Click position: {`[${clickPosition[0]}], [${clickPosition[1]}]`}</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};