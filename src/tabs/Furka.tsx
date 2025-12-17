const webcams = [
  "https://www.dieselcrew.ch/webcam/tiefenbach.jpg",
  "https://www.albertheimhuette.ch/webcam/albertheimhuette_west.jpg",
  "https://www.albertheimhuette.ch/webcam/albertheimhuette_ost.jpg",
];

const alpenPasseUrl = "https://alpen-paesse.ch/en/alpenpaesse/furkapass/";

const Furka = () => {
  return (
    <>
      <div className="mobileScrollAdapter">
        <iframe
          title="Furka Pass"
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
    </>
  );
};

export default Furka;
