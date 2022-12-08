import { useLeafletContext } from "@react-leaflet/core";
import 'leaflet/dist/leaflet.css';
import 'proj4leaflet';
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import 'proj4leaflet';
import { useDidUpdateEffect } from "./useDidUpdateEffect";

const Geoman = ({ handlePolygons }) => {
    const context = useLeafletContext();

    useDidUpdateEffect(() => {
        const leafletContainer = context.layerContainer || context.map;

        leafletContainer.pm.addControls({
            drawMarker: true,
            drawCircleMarker: true,
            drawPolyline: true,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: true,
            editMode: true,
            dragMode: true,
            cutPolygon: true,
            removalMode: true
        });

        leafletContainer.pm.setGlobalOptions({ pmIgnore: false });

        leafletContainer.on("pm:create", (e) => {

            if (e.layer._latlngs) {
                handlePolygons(e.layer._latlngs);
            }

        });

        leafletContainer.on("pm:remove", (e) => {
            console.log("object removed");
        });

        return () => {
            leafletContainer.pm.removeControls();
            leafletContainer.pm.setGlobalOptions({ pmIgnore: true });
        };
    }, [context]);

    return null;
}

export default Geoman;