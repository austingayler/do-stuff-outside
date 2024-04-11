import http from "http";
import fs from "fs";
import path from "path";
const __dirname = path.resolve();

const server = http.createServer((req, res) => {
  const url = req.url;
  if (!url) return;

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  ); /* @dev First, read about security */
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Max-Age", 2592000); // 30 days
  res.setHeader("Access-Control-Allow-Headers", "content-type"); // Might be helpful

  // Check if the request is for an image
  if (url.startsWith("/rain/") && url.endsWith(".png")) {
    const imagePath = path.join(__dirname, "rain", url.slice(6)); // Extract the filename from the URL
    console.log(imagePath);

    // Check if the image file exists
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Image not found");
      } else {
        // Serve the image
        const imageStream = fs.createReadStream(imagePath);
        imageStream.pipe(res);
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
