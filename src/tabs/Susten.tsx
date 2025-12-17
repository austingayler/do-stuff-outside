const webcams = [
  "https://livecam.sustenpass.ch/Steinalp-Lodge000M.jpg",
  "https://livecam.sustenpass.ch/SteinPTZ000M.jpg",
  "https://livecam.sustenpass.ch/Sustenpass000M.jpg",
];

const alpenPasseUrl = "https://alpen-paesse.ch/en/alpenpaesse/sustenpass/";

const Susten = () => {
  return (
    <>
      <div className="mobileScrollAdapter">
        <iframe
          title="Susten Pass"
          style={{
            width: "100%",
            height: 800,
          }}
          allow="geolocation"
          src={alpenPasseUrl}
          className="rainbowBorder"
        />
      </div>

      {webcams.map((wc) => (
        <a key={wc} href={wc} target="_blank" rel="noreferrer">
          <img
            src={`${wc}?cacheKiller=${new Date().valueOf()}`}
            className="w-full object-contain"
            alt="webcam"
          />
        </a>
      ))}

      <img
        src="https://gadmen.ddns.net/axis-cgi/mjpg/video.cgi?resolution=1920x1080"
        className="w-full object-contain"
        alt="Gadmen webcam"
      />
      <img
        src={`https://images.bergfex.at/webcams/?id=11008&format=44&t=${new Date().valueOf()}`}
        className="w-full object-cover"
        alt="Gadmen Tälli"
      />
    </>
  );
};

export default Susten;
