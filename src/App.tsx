import "./App.css";
import "leaflet/dist/leaflet.css";
import { useSyncedLocalStorage } from "./hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PassType } from "./types";
import type { SelectedPass } from "./types";
import Huts from "./Huts";
import { Fly, Ski, Conditions, Furka, Grimsel, Susten, Goeschenen } from "./tabs";

const imgKey = new Date().valueOf();

const queryClient = new QueryClient();

function App() {
  const [selectedPass, setSelectedPass] =
    useSyncedLocalStorage<SelectedPass>("selectedPass", null);

  const handleButtonClick = (pass: PassType) => {
    if (pass === selectedPass) {
      setSelectedPass(null);
    } else {
      setSelectedPass(pass);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full flex flex-col justify-center items-center gap-4">
        <h1>DO STUFF OUTSIDE</h1>

        <a
          href="https://jungfrau.roundshot.co/interlaken-harderkulm/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={`https://images-webcams.windy.com/74/1697034574/current/original/1697034574.jpg?token=swisswebcams.ch:9156f0c37c25cc78a1e06141918809d3:1710835200&cacheKiller=${Date.now()}`}
            className="aspect-auto w-full object-cover"
            alt="View from Harder Kulm"
            key={imgKey}
          />
        </a>

        <div className="flex space-x-4 gap-2 justify-center flex-wrap">
          <button
            type="button"
            className={`${
              selectedPass === PassType.FLY ? "bg-purple-500" : "bg-gray-500"
            } hover:bg-purple-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.FLY)}
          >
            Fly
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.SKI ? "bg-purple-500" : "bg-gray-500"
            } hover:bg-purple-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.SKI)}
          >
            Ski
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.CONDITIONS ? "bg-purple-500" : "bg-gray-500"
            } hover:bg-purple-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.CONDITIONS)}
          >
            Conditions
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.FURKA ? "bg-blue-500" : "bg-gray-500"
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.FURKA)}
          >
            Furka
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.GRIMSEL ? "bg-blue-500" : "bg-gray-500"
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.GRIMSEL)}
          >
            Grimsel
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.SUSTEN ? "bg-blue-500" : "bg-gray-500"
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.SUSTEN)}
          >
            Susten
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.GOESCHENEN
                ? "bg-blue-500"
                : "bg-gray-500"
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.GOESCHENEN)}
          >
            Göschenen
          </button>
          <button
            type="button"
            className={`${
              selectedPass === PassType.HUT ? "bg-blue-500" : "bg-gray-500"
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick(PassType.HUT)}
          >
            Huts
          </button>
        </div>

        {selectedPass === PassType.FLY && <Fly />}
        {selectedPass === PassType.SKI && <Ski />}
        {selectedPass === PassType.CONDITIONS && <Conditions />}
        {selectedPass === PassType.FURKA && <Furka />}
        {selectedPass === PassType.GRIMSEL && <Grimsel />}
        {selectedPass === PassType.SUSTEN && <Susten />}
        {selectedPass === PassType.GOESCHENEN && <Goeschenen />}
        {selectedPass === PassType.HUT && <Huts />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
