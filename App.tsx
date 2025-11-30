import React, { useState } from 'react';
import { UserPreferences, Itinerary } from './types';
import { generateItinerary } from './services/geminiService';
import MapComponent from './components/MapComponent';
import ItineraryPanel from './components/ItineraryPanel';
import ChatWidget from './components/ChatWidget';
import { Compass, Users, Clock, Accessibility, Loader2, MapPin } from 'lucide-react';

function App() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    startTime: '09:00',
    participants: 2,
    pace: 'moderate',
    accessibility: false,
    focusArtists: []
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateItinerary(preferences);
      setItinerary(result);
    } catch (error) {
      alert("Impossibile generare l'itinerario. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const toggleArtist = (artist: string) => {
    setPreferences(prev => {
      const exists = prev.focusArtists.includes(artist);
      return {
        ...prev,
        focusArtists: exists 
          ? prev.focusArtists.filter(a => a !== artist)
          : [...prev.focusArtists, artist]
      };
    });
  };

  if (!itinerary) {
    // Landing / Setup Screen
    return (
      <div className="h-screen w-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Minimalist Background Map Hint */}
        <div className="absolute inset-0 opacity-30 pointer-events-none grayscale">
             <MapComponent itinerary={null} selectedStopId={null} />
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent"></div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl max-w-xl w-full rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50 z-10 overflow-hidden">
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mb-6">
              <Compass size={24} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 font-serif-display mb-2">Roma Barocca</h1>
            <p className="text-zinc-500 font-medium tracking-wide text-sm uppercase">Curatore di Viaggi IA</p>
          </div>
          
          <div className="px-10 pb-10 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={12} /> Orario Inizio
                </label>
                <input 
                  type="time" 
                  value={preferences.startTime}
                  onChange={(e) => setPreferences({...preferences, startTime: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-zinc-100 py-2 text-lg font-semibold text-zinc-800 focus:border-orange-500 focus:outline-none transition-colors font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Users size={12} /> Ospiti
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  value={preferences.participants}
                  onChange={(e) => setPreferences({...preferences, participants: parseInt(e.target.value)})}
                  className="w-full bg-transparent border-b-2 border-zinc-100 py-2 text-lg font-semibold text-zinc-800 focus:border-orange-500 focus:outline-none transition-colors font-sans"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Artisti in Risalto</label>
              <div className="flex flex-wrap gap-2">
                {['Bernini', 'Borromini', 'Caravaggio', 'P. da Cortona', 'A. Pozzo'].map(artist => (
                  <button
                    key={artist}
                    onClick={() => toggleArtist(artist)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border
                      ${preferences.focusArtists.includes(artist) 
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
                    `}
                  >
                    {artist}
                  </button>
                ))}
              </div>
            </div>

             <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full transition-colors ${preferences.accessibility ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      <Accessibility size={20} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-zinc-700">Accessibilità</span>
                      <span className="text-xs text-zinc-400">Evita scale e barriere</span>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={preferences.accessibility} onChange={(e) => setPreferences({...preferences, accessibility: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
             </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-4 rounded-2xl shadow-xl shadow-zinc-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Pianifica il Mio Viaggio <MapPin size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative bg-zinc-50 overflow-hidden font-sans">
      
      {/* 1. Full Screen Map (Always Visible) */}
      <div className="absolute inset-0 z-0">
        <MapComponent itinerary={itinerary} selectedStopId={selectedStopId} />
      </div>

      {/* 2. Floating Panel (Desktop: Sidebar, Mobile: Bottom Sheet) */}
      <div className={`
        absolute 
        z-10 
        transition-all duration-500 ease-in-out
        
        /* Mobile: Bottom Sheet */
        bottom-0 left-0 w-full 
        h-[45vh]  /* Default height on mobile */
        rounded-t-[2rem] 
        shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        bg-white/95 backdrop-blur-md

        /* Desktop: Floating Sidebar */
        md:top-4 md:left-4 md:bottom-4 md:h-auto md:w-[400px]
        md:rounded-[2rem]
        md:shadow-[8px_0_30px_rgba(0,0,0,0.08)]
        md:border md:border-white/50
      `}>
        {/* Handle for Mobile Sheet */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-zinc-300 rounded-full"></div>
        </div>

        <ItineraryPanel 
          itinerary={itinerary} 
          selectedStopId={selectedStopId}
          onStopClick={setSelectedStopId}
        />
      </div>

      {/* 3. Floating Chat Widget */}
      <ChatWidget itinerary={itinerary} />
      
    </div>
  );
}

export default App;