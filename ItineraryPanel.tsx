import React from 'react';
import { Itinerary, Stop } from '../types';
import { Clock, Download, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ItineraryPanelProps {
  itinerary: Itinerary;
  onStopClick: (id: string) => void;
  selectedStopId: string | null;
}

const ItineraryPanel: React.FC<ItineraryPanelProps> = ({ itinerary, onStopClick, selectedStopId }) => {

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // 1. Title & Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(234, 88, 12); // Orange-600

    const maxTitleWidth = pageWidth - (margin * 2);
    const titleLines = doc.splitTextToSize(itinerary.title, maxTitleWidth);
    
    // Start drawing title at Y=20. jsPDF draws text from the baseline.
    // If multiple lines, it draws them downwards.
    doc.text(titleLines, margin, 20);

    // Calculate vertical space used by title
    // Approx 10mm per line for font size 22 is a safe buffer
    const titleHeight = titleLines.length * 10;
    
    let currentY = 20 + titleHeight - 2; // -2 to tighten slightly

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    doc.text(`Generato il: ${itinerary.date}`, margin, currentY);

    let startY = currentY + 10;

    // 2. Capture Map
    const mapElement = document.getElementById('map-container');
    if (mapElement) {
      try {
        // Capture map using html2canvas with higher scale for better resolution
        const canvas = await html2canvas(mapElement, {
          useCORS: true, // Important for OSM tiles
          allowTaint: true,
          scale: 2, // 2x resolution for crisp PDF
          logging: false,
          ignoreElements: (element) => {
            return element.tagName === 'BUTTON' || element.classList.contains('leaflet-control-zoom');
          }
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // --- Strict Aspect Ratio Logic ---
        const maxContentWidth = pageWidth - (margin * 2);
        const maxContentHeight = 150; // Allow up to 150mm height (about half page)
        
        const srcWidth = canvas.width;
        const srcHeight = canvas.height;
        const ratio = srcWidth / srcHeight;

        // Calculate dimensions to fit within the box while preserving ratio
        let finalWidth = maxContentWidth;
        let finalHeight = finalWidth / ratio;

        // If height exceeds max allowed, scale down based on height
        if (finalHeight > maxContentHeight) {
          finalHeight = maxContentHeight;
          finalWidth = finalHeight * ratio;
        }

        // Center the image horizontally
        const xOffset = margin + (maxContentWidth - finalWidth) / 2;

        doc.addImage(imgData, 'PNG', xOffset, startY, finalWidth, finalHeight);
        
        // Move cursor below the image
        startY += finalHeight + 10;
      } catch (error) {
        console.error("Map capture failed:", error);
      }
    }

    // 3. Itinerary Table
    const tableData = itinerary.stops.map((stop) => [
      `${stop.arrivalTime}`,
      stop.name,
      stop.artists.join(", "),
      stop.description
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Ora', 'Luogo', 'Artisti', 'Note']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] }, // Zinc-900
      styles: { fontSize: 10, cellPadding: 4, textColor: 50 },
      columnStyles: { 
        0: { cellWidth: 20, fontStyle: 'bold' }, 
        1: { cellWidth: 40, fontStyle: 'bold' }, 
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' } 
      },
      // Handle page breaks if table is too long
      margin: { top: 20, bottom: 20 }
    });

    // 4. Credits & Footer
    const footerY = pageHeight - 20;
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(82, 82, 91); // Zinc-600
    doc.text("Credits: bv In arte...ASCI", 14, footerY);
    
    doc.setTextColor(234, 88, 12); // Orange Link Color
    doc.textWithLink("Ascolta su Spotify", 14, footerY + 6, { 
      url: "https://open.spotify.com/show/47j4qfbTq1vD0gOCm4CUyL?si=YAhZBQjiR-uC86DRsWxb8A" 
    });

    doc.save("roma-barocca-itinerary.pdf");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-[inherit]">
      {/* Minimal Header */}
      <div className="px-6 py-5 border-b border-zinc-100 bg-white/50 flex-shrink-0">
        <h2 className="text-xl font-bold text-zinc-900 font-serif-display leading-tight">{itinerary.title}</h2>
        <div className="flex justify-between items-end mt-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
             <Clock size={12} /> 1 Giorno
          </p>
          <button 
            onClick={handleExportPDF}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <Download size={12} /> PDF
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
        {itinerary.stops.map((stop, index) => {
          const isSelected = selectedStopId === stop.id;
          return (
            <div 
              key={stop.id}
              onClick={() => onStopClick(stop.id)}
              className={`
                group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border
                ${isSelected 
                  ? 'bg-zinc-900 text-white shadow-lg border-zinc-900 ring-2 ring-orange-500/50' 
                  : 'bg-white hover:bg-zinc-50 border-zinc-100 hover:border-zinc-200'}
              `}
            >
              {/* Connector Line (Visual only, hidden on last item) */}
              {index !== itinerary.stops.length - 1 && (
                <div className={`
                  absolute left-[27px] top-[4rem] bottom-[-1rem] w-px z-0
                  ${isSelected ? 'bg-zinc-700' : 'bg-zinc-200'}
                `}></div>
              )}

              <div className="flex gap-4 relative z-10">
                {/* Time Column */}
                <div className="flex flex-col items-center gap-1 min-w-[3.5rem]">
                  <span className={`text-xs font-bold ${isSelected ? 'text-orange-400' : 'text-zinc-900'}`}>
                    {stop.arrivalTime}
                  </span>
                  <div className={`
                    w-2.5 h-2.5 rounded-full border-2 
                    ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-white border-zinc-300 group-hover:border-orange-400'}
                  `}></div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                      {stop.name}
                    </h3>
                  </div>
                  
                  {stop.artists.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {stop.artists.slice(0, 2).map(artist => (
                        <span key={artist} className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide ${isSelected ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
                          {artist}
                        </span>
                      ))}
                      {stop.artists.length > 2 && (
                         <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>+{stop.artists.length - 2}</span>
                      )}
                    </div>
                  )}

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {stop.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItineraryPanel;