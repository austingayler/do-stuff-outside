const webcams = [
  "https://webcam.kw-goeschenen.ch/webcam/bild.jpg",
  "https://webcam.kw-goeschenen.ch/cam_kwg/bild.jpg",
  "https://webcam.goeschenen.ch/gemeinde/live.jpg",
];

const Goeschenen = () => {
  return (
    <>
      {webcams.map((wc) => (
        <a key={wc} href={wc} target="_blank" rel="noreferrer">
          <img
            src={`${wc}?cacheKiller=${new Date().valueOf()}`}
            className="w-full object-contain"
            alt="webcam"
          />
        </a>
      ))}

      <div className="mobileScrollAdapter">
        <iframe
          title="Göschenen"
          style={{
            width: "100%",
            height: 800,
          }}
          allow="geolocation"
          src="https://www.kw-goeschenen.ch/news/goscheneralpstrasse"
          className="rainbowBorder"
        />
      </div>
    </>
  );
};

export default Goeschenen;
