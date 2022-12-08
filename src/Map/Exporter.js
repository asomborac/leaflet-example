import { useEffect } from 'react';
import { useMap } from 'react-leaflet'

export default function Exporter({ exporter, handleMapState }) {
    const map = useMap();
    useEffect(() => { if (exporter === true) handleMapState(map) })
    return null;
};