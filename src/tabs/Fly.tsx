import { useState } from "react";
import HighWinds2 from "../HighWinds2";
import JungfraujochForecast from "../components/JungfraujochForecast";

const dabsLink = "https://www.skybriefing.com/portal/delegate/dabs?today";

const Fly = () => {
  const [showHighWinds2, setShowHighWinds2] = useState(true);

  return (
    <>
      <div className="mobileScrollAdapter">
        <div className="w-full iframeContainer">
          <iframe
            title="Winds.mobi"
            style={{
              width: "100%",
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
        src="https://www.srf.ch/meteo/static/prognosetafeln/wind/BISENDIAGRAMM.jpg"
        className="w-full object-contain"
        style={{ maxWidth: 638, maxHeight: 477 }}
        alt="Bise diagram"
        key={Date.now()}
      />

      <a
        target="_blank"
        href={dabsLink}
        style={{ fontSize: 72 }}
        rel="noreferrer"
      >
        DABS
        <sup className="new-tab-icon">↗</sup>
      </a>

      <button type="button" onClick={() => setShowHighWinds2(!showHighWinds2)}>
        Show High Winds 2
      </button>

      {showHighWinds2 && <HighWinds2 />}

      <JungfraujochForecast />
    </>
  );
};

export default Fly;
