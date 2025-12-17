const webcams = [
  "https://www.hostetbach.ch/webcam/hostetbach.jpg",
  "https://lexcam.ch/camera/webcam-baeren-guttannen/latest-image.jpg",
];

const alpenPasseUrl = "https://alpen-paesse.ch/en/alpenpaesse/grimselpass/";

const Grimsel = () => {
  return (
    <>
      <div className="mobileScrollAdapter">
        <iframe
          title="Grimsel Pass"
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

      <div className="mobileScrollAdapter">
        <iframe
          title="Grimsel Roundshot"
          id="rs_cam_1734"
          src="https://grimselwelt.roundshot.com/hospiz#/init-lang/en"
          className="rainbowBorder"
          style={{
            width: "100%",
            height: 800,
          }}
        />
      </div>
    </>
  );
};

export default Grimsel;
