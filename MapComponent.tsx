import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Itinerary, Stop } from '../types';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  itinerary: Itinerary | null;
  selectedStopId: string | null;
}

const FitBounds = ({ stops }: { stops: Stop[] }) => {
  const map = useMap();
  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stops, map]);
  return null;
};

const MapComponent: React.FC<MapProps> = ({ itinerary, selectedStopId }) => {
  const romeCenter: [number, number] = [41.9028, 12.4964];

  // Standard OpenStreetMap Tiles (Colorful)
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (!itinerary) {
    return (
      <MapContainer 
        id="map-container"
        center={romeCenter} 
        zoom={13} 
        className="w-full h-full z-0 opacity-80" 
        zoomControl={false}
      >
        <TileLayer attribution={attribution} url={tileUrl} />
      </MapContainer>
    );
  }

  const polylinePositions = itinerary.stops.map(s => [s.coordinates.lat, s.coordinates.lng] as [number, number]);

  return (
    <MapContainer 
      id="map-container"
      center={romeCenter} 
      zoom={13} 
      className="w-full h-full z-0" 
      zoomControl={false}
    >
      <TileLayer attribution={attribution} url={tileUrl} />
      <FitBounds stops={itinerary.stops} />
      
      {/* Route Line - Terracotta Orange */}
      <Polyline positions={polylinePositions} color="#ea580c" weight={4} dashArray="5, 10" opacity={0.9} />

      {itinerary.stops.map((stop, idx) => (
        <Marker 
          key={stop.id} 
          position={[stop.coordinates.lat, stop.coordinates.lng]}
          opacity={selectedStopId && selectedStopId !== stop.id ? 0.6 : 1}
        >
          <Popup className="font-sans">
            <div className="text-center p-1">
              <h3 className="font-bold text-zinc-900 text-sm">{idx + 1}. {stop.name}</h3>
              <p className="text-xs text-zinc-500 mt-1">{stop.arrivalTime} - {stop.departureTime}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;