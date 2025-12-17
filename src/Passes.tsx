import { PassType } from "./types";
import type { SelectedPass } from "./types";

const furka = "https://alpen-paesse.ch/en/alpenpaesse/furkapass/";
const susten = "https://alpen-paesse.ch/en/alpenpaesse/sustenpass/";
const grimsel = "https://alpen-paesse.ch/en/alpenpaesse/grimselpass/";

const passes: { [id in PassType]?: string } = {
  [PassType.FURKA]: furka,
  [PassType.SUSTEN]: susten,
  [PassType.GRIMSEL]: grimsel,
};

const webcams: { [id in PassType]?: string[] } = {};

// biome-ignore lint/complexity/noForEach: <explanation>
// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
Object.values(PassType).forEach((p) => (webcams[p] = []));

webcams[PassType.FURKA] = [
  "https://www.dieselcrew.ch/webcam/tiefenbach.jpg",
  "https://www.albertheimhuette.ch/webcam/albertheimhuette_west.jpg",
  "https://www.albertheimhuette.ch/webcam/albertheimhuette_ost.jpg",
];
webcams[PassType.GOESCHENEN] = [
  "https://webcam.kw-goeschenen.ch/webcam/bild.jpg",
  "https://webcam.kw-goeschenen.ch/cam_kwg/bild.jpg",
  "https://images-webcams.windy.com/35/1583226235/current/full/1583226235.jpg",
];
webcams[PassType.GRIMSEL] = [
  "https://www.hostetbach.ch/webcam/hostetbach.jpg",
  "https://lexcam.ch/camera/webcam-baeren-guttannen/latest-image.jpg",
];
webcams[PassType.SUSTEN] = [
  "https://livecam.sustenpass.ch/Steinalp-Lodge000M.jpg",
  "https://livecam.sustenpass.ch/SteinPTZ000M.jpg",
  "https://livecam.sustenpass.ch/Sustenpass000M.jpg",
];

const Passes = ({ selectedPass }: { selectedPass: SelectedPass }) => {
  return (
    <>
      {selectedPass && passes[selectedPass] && (
        <div
          key={`${selectedPass}alpen-paesse`}
          className="mobileScrollAdapter"
        >
          <iframe
            title="Gadmen iframe"
            style={{
              width: "100%",
              height: 800,
            }}
            allow="geolocation"
            key={selectedPass}
            src={passes[selectedPass]}
            className="rainbowBorder"
          />
        </div>
      )}

      {selectedPass && webcams[selectedPass] && (
        // biome-ignore lint/complexity/noUselessFragments: <explanation>
        <>
          {webcams[selectedPass].map((wc) => (
            <a key={wc} href={wc} target="_blank" rel="noreferrer">
              <img
                src={`${wc}?cacheKiller=${new Date().valueOf()}`}
                className="w-full object-contain"
                alt="webcam"
                key={wc}
              />
            </a>
          ))}
        </>
      )}

      {selectedPass === PassType.GRIMSEL && (
        <div key={selectedPass} className="mobileScrollAdapter">
          <iframe
            title="Grimsel"
            id="rs_cam_1734"
            src="https://grimselwelt.roundshot.com/hospiz#/init-lang/en"
            className="rainbowBorder"
            style={{
              width: "100%",
              height: 800,
            }}
          />
        </div>
      )}

      {selectedPass === PassType.SUSTEN && (
        <>
          <img
            src={
              "https://gadmen.ddns.net/axis-cgi/mjpg/video.cgi?resolution=1920x1080"
            }
            className="w-full object-contain"
            alt="webcam"
          />
          <img
            src={`https://images.bergfex.at/webcams/?id=11008&format=44&t=${new Date().valueOf()}`}
            className="w-full object-cover"
            alt="Gadmen Tälli"
          />
        </>
      )}

      {selectedPass === PassType.GOESCHENEN && (
        <div key={selectedPass} className="mobileScrollAdapter">
          <iframe
            title="Gadmen iframe"
            style={{
              width: "100%",
              height: 800,
            }}
            allow="geolocation"
            key={selectedPass}
            src={`https://www.kw-goeschenen.ch/news/goscheneralpstrasse`}
            className="rainbowBorder"
          />
        </div>
      )}
    </>
  );
};

export default Passes;
