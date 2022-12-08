import L from 'leaflet';
import 'proj4leaflet';

const polygonArea = points => {
    const numPoints = points.length;
    let area = 0;         // Accumulates area in the loop
    let j = numPoints - 1;  // The last vertex is the 'previous' one to the first
    for (let i = 0; i < numPoints; i++) {
        area = area + (points[j].x + points[i].x) * (points[j].y - points[i].y);
        j = i;  //j is previous vertex to i
    }
    return Math.abs((area / 10000) / 2);
};

export const calculateArea = polygon => {
    let outerRing = [...polygon[0]];
    const firstPoint = outerRing[0];
    outerRing.push(firstPoint);
    const utmZone = Math.floor(firstPoint.lng / 6 + 31);
    const epsgCode = 32600 + utmZone;
    const utmCrs = new L.Proj.CRS(`EPSG:${epsgCode}`, `+proj=utm +zone=${utmZone} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`);
    const utmPolygon = outerRing.map(point => utmCrs.project(point));
    return polygonArea(utmPolygon);
};