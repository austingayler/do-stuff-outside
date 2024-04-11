const furka = "https://alpen-paesse.ch/en/alpenpaesse/furkapass/";
const susten = "https://alpen-paesse.ch/en/alpenpaesse/sustenpass/";
const grimsel = "https://alpen-paesse.ch/en/alpenpaesse/grimselpass/";

const passes: { [id: string]: string } = {
  furka,
  susten,
  grimsel,
};

import { useState } from "react";

const Passes = () => {
  // State to store the fetched HTML content
  //   const [htmlContent, setHtmlContent] = useState("");

  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  // Function to handle button click and update state
  const handleButtonClick = (string: string) => {
    if (string === selectedPass) {
      setSelectedPass(null);
    } else {
      setSelectedPass(string);
    }
  };

  //   useEffect(() => {
  //     const fetchHtmlContent = async () => {
  //       try {
  //         // Fetch the HTML content from the desired webpage
  //         const response = await fetch(furka);
  //         if (!response.ok) {
  //           throw new Error("Failed to fetch HTML content");
  //         }
  //         // Get the HTML content from the response
  //         const html = await response.text();
  //         // Update the state with the fetched HTML content
  //         setHtmlContent(html);
  //       } catch (error) {
  //         console.error("Error fetching HTML content:", error);
  //       }
  //     };

  //     // Call the fetchHtmlContent function when the component mounts
  //     fetchHtmlContent();

  //     // Cleanup function
  //     return () => {
  //       // Optionally perform cleanup tasks here
  //     };
  //   }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <>
      {/* <div dangerouslySetInnerHTML={{ __html: htmlContent }} /> */}
      <div className="flex space-x-4">
        <button
          className={`${
            selectedPass === "furka" ? "bg-blue-500" : "bg-gray-500"
          } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
          onClick={() => handleButtonClick("furka")}
        >
          Furka
        </button>
        <button
          className={`${
            selectedPass === "grimsel" ? "bg-green-500" : "bg-gray-500"
          } hover:bg-green-700 text-white font-bold py-2 px-4 rounded`}
          onClick={() => handleButtonClick("grimsel")}
        >
          Grimsel
        </button>
        <button
          className={`${
            selectedPass === "susten" ? "bg-red-500" : "bg-gray-500"
          } hover:bg-red-700 text-white font-bold py-2 px-4 rounded`}
          onClick={() => handleButtonClick("susten")}
        >
          Susten
        </button>
      </div>

      {selectedPass && (
        <div className="w-full">
          <iframe
            style={{
              width: "100%",
              height: 800,
            }}
            allow="geolocation"
            src={passes[selectedPass]}
          />
        </div>
      )}
    </>
  );
};

export default Passes;
