import './App.css';
import 'leaflet/dist/leaflet.css';
import Passes from './Passes';
import { useSyncedLocalStorage } from './hooks';

const dabsLink = 'https://www.skybriefing.com/portal/delegate/dabs?today';

const imgKey = new Date().valueOf();

function App() {
  const [selectedPass, setSelectedPass] = useSyncedLocalStorage('fly');

  const handleButtonClick = (string: string) => {
    if (string === selectedPass) {
      setSelectedPass(null);
    } else {
      setSelectedPass(string);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col justify-center items-center gap-4">
        <h1>DO STUFF OUTSIDE</h1>

        {/* <WeatherSlider /> */}

        <a
          href="https://jungfrau.roundshot.co/interlaken-harderkulm/"
          target="_blank"
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
            className={`${
              selectedPass === 'fly' ? 'bg-purple-500' : 'bg-gray-500'
            } hover:bg-purple-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('fly')}
          >
            Fly
          </button>
          <button
            className={`${
              selectedPass === 'ski' ? 'bg-purple-500' : 'bg-gray-500'
            } hover:bg-purple-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('ski')}
          >
            Ski
          </button>
          <button
            className={`${
              selectedPass === 'furka' ? 'bg-blue-500' : 'bg-gray-500'
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('furka')}
          >
            Furka
          </button>
          <button
            className={`${
              selectedPass === 'grimsel' ? 'bg-blue-500' : 'bg-gray-500'
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('grimsel')}
          >
            Grimsel
          </button>
          <button
            className={`${
              selectedPass === 'susten' ? 'bg-blue-500' : 'bg-gray-500'
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('susten')}
          >
            Susten
          </button>
          <button
            className={`${
              selectedPass === 'goeschenen' ? 'bg-blue-500' : 'bg-gray-500'
            } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
            onClick={() => handleButtonClick('goeschenen')}
          >
            Göschenen
          </button>
        </div>

        <Passes selectedPass={selectedPass} />

        {/* <WeatherMap /> */}

        {/* <div className="iframeContainer w-full">
          <iframe
            style={{
              pointerEvents: "none",
            }}
            width="100%"
            height="450"
            src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=7&overlay=rain&product=ecmwf&level=surface&lat=46.808&lon=8.152&detailLat=44.91813929958517&detailLon=5.998535156250001&marker=true&message=true"
          ></iframe>
        </div> */}

        {selectedPass === 'fly' && (
          <>
            <div className="mobileScrollAdapter">
              <div className="w-full iframeContainer ">
                <iframe
                  style={{
                    width: '100%',
                    height: 600,
                  }}
                  allow="geolocation"
                  src="https://winds.mobi/stations/list?lat=46.6833&lon=7.8500&zoom=15"
                />
              </div>
            </div>
            <img
              src={`https://www.srf.ch/meteo/static/prognosetafeln/wind/FOEHNDIAGRAMM.jpg?cacheKiller=${Date.now()}`}
              className="w-full object-contain"
              style={{ maxWidth: 638, maxHeight: 477 }}
              alt="Foehn diagram"
            />
            <img
              src={
                'https://www.srf.ch/meteo/static/prognosetafeln/wind/BISENDIAGRAMM.jpg'
              }
              className="w-full object-contain"
              style={{ maxWidth: 638, maxHeight: 477 }}
              alt="Bise diagram"
              key={Date.now()}
            />

            <a target="_blank" href={dabsLink} style={{ fontSize: 72 }}>
              DABS
              <sup className="new-tab-icon">↗</sup>
            </a>
          </>
        )}
        {selectedPass === 'ski' && (
          <p>No ski stuff yet</p>
        )}


      </div>
    </>
  );
}

export default App;
