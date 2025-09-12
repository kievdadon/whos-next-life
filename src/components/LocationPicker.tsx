import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search, X } from "lucide-react";

interface LocationResult {
  place_name: string;
  center: [number, number];
  address?: string;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; coordinates: [number, number] }) => void;
  currentLocation?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation = "Enter your address"
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      setShowTokenInput(false);
    }
  }, []);

  const searchLocations = async (query: string) => {
    if (!query.trim() || !mapboxToken) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=US&limit=5&types=address,poi`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }
      
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search locations. Please check your Mapbox token.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsUsingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address`
          );
          
          if (!response.ok) {
            throw new Error('Failed to reverse geocode');
          }
          
          const data = await response.json();
          const feature = data.features[0];
          
          if (feature) {
            onLocationSelect({
              address: feature.place_name,
              coordinates: [longitude, latitude]
            });
            onClose();
            toast({
              title: "Location Set",
              description: "Using your current location.",
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Location Error",
            description: "Failed to get your address. Please search manually.",
            variant: "destructive",
          });
        } finally {
          setIsUsingCurrentLocation(false);
        }
      },
      (error) => {
        setIsUsingCurrentLocation(false);
        toast({
          title: "Location Access Denied",
          description: "Please allow location access or search manually.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleLocationSelect = (result: LocationResult) => {
    onLocationSelect({
      address: result.place_name,
      coordinates: result.center
    });
    onClose();
    toast({
      title: "Location Set",
      description: result.place_name,
    });
  };

  const handleTokenSave = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox public token.",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem('mapbox_token', mapboxToken);
    setShowTokenInput(false);
    toast({
      title: "Token Saved",
      description: "You can now search for locations.",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Choose Your Location</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {/* Mapbox Token Input */}
            {showTokenInput && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-sm">Mapbox Public Token Required</h3>
                      <p className="text-xs text-muted-foreground">
                        Get your free token at{' '}
                        <a 
                          href="https://mapbox.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          mapbox.com
                        </a>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="pk.eyJ1..."
                        value={mapboxToken}
                        onChange={(e) => setMapboxToken(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleTokenSave} size="sm">
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showTokenInput && (
              <>
                {/* Current Location Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={getCurrentLocation}
                  disabled={isUsingCurrentLocation}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {isUsingCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                </Button>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for an address..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {isSearching && (
                    <div className="text-center py-4 text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  
                  {!isSearching && searchResults.length === 0 && searchQuery && (
                    <div className="text-center py-4 text-muted-foreground">
                      No locations found. Try a different search.
                    </div>
                  )}
                  
                  {searchResults.map((result, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.place_name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationPicker;