import { useEffect, useRef } from 'react';

import { Map as MapCn, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';

type Coordinates = {
    lat: number;
    lng: number;
};

type AddressMapProps = {
    position: Coordinates | null;
    zoom: number;
    onSelect: (coordinates: Coordinates) => void;
};

const defaultPosition = { lat: 10.25, lng: 123.00 }; // Negros Island overview center

function MapInteractions({ position, zoom, onSelect }: AddressMapProps) {
    const { map } = useMap();
    const onSelectRef = useRef(onSelect);
    const latitude = position?.lat;
    const longitude = position?.lng;
    onSelectRef.current = onSelect;

    useEffect(() => {
        if (!map) {
            return;
        }

        const handleClick = (event: { lngLat: { lat: number; lng: number } }) => {
            onSelectRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [map]);

    useEffect(() => {
        if (map && latitude !== undefined && longitude !== undefined) {
            map.flyTo({ center: [longitude, latitude], zoom });
        }
    }, [map, latitude, longitude, zoom]);

    return null;
}

export default function AddressMap({ position, zoom, onSelect }: AddressMapProps) {
    return (
        <MapCn
            center={[position?.lng ?? defaultPosition.lng, position?.lat ?? defaultPosition.lat]}
            zoom={zoom}
            theme="dark"
            className="z-0 h-full w-full"
            maxBounds={[
                [122.35, 9.02],
                [123.58, 11.05],
            ]}
            minZoom={8.5}
        >
            <MapInteractions position={position} zoom={zoom} onSelect={onSelect} />
            <MapControls position="top-right" />
            {position && (
                <MapMarker longitude={position.lng} latitude={position.lat} draggable onDragEnd={({ lat, lng }) => onSelect({ lat, lng })}>
                    <MarkerContent>
                        <div className="h-[18px] w-[18px] rounded-full border-[3px] border-white bg-red-500 shadow-[0_1px_5px_#000]" />
                    </MarkerContent>
                </MapMarker>
            )}
        </MapCn>
    );
}
