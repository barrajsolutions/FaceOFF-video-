# Route Mapper

Web app for Intelcom driver manifests (PDF). Load a manifest, choose a route, and get:
- delivery stops (packages to the same building grouped), positioned with the official
  Adresses Québec register
- the driving route in manifest order (OSRM / OpenStreetMap roads) with total km
- analysis per municipality and street, back-and-forth runs, and issues to verify
- exports: stops CSV, packages CSV, Google My Maps KML

Everything runs in the browser; the PDF never leaves the device. Open `index.html`.
