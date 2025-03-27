import { useState } from "react";
import huts from "./assets/huts.json";
import HutCard from "./components/HutCard";
// Helper function to normalize strings for comparison
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    // Replace umlauts with their non-umlaut versions
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    // Remove any other diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface Hut {
  hutId: string;
  hutName: string;
  hutCountry: string;
}

const Huts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const matchingHuts = searchTerm.length > 0
    ? (huts).filter(hut => {
        const normalizedSearch = normalize(searchTerm);
        const normalizedName = normalize(hut.hutName);
        return normalizedName.includes(normalizedSearch);
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search huts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {searchTerm.length > 0 && matchingHuts.length >= 4 && (
          <p className="text-gray-600 italic">
            Please enter more characters to narrow down your search...
          </p>
        )}

        {searchTerm.length > 0 && matchingHuts.length > 0 && matchingHuts.length < 4 && (
          matchingHuts.map(hut => (
            <HutCard key={hut.hutId} hutId={hut.hutId} />
          ))
        )}
      </div>
    </div>
  );
};

export default Huts;
