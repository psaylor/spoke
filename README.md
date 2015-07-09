# spoke
Spoke is a framework for building interactive speech-enabled web applications. It leverages modern web technologies such as the Web Audio APIs, WebSockets, and Node.js to provide a standardized and streamlined way to build website demos featuring one's own spoken language technologies on the backend. Spoke consists of two components (each their own project with github repo) that should be used in conjunction to build web applications:

1. [spoke](https://github.com/psaylor/spoke "the spoke repo"): a Node.js server-side library with a set of modules that interface with a handful of custom speech technologies (such as speech recognition, forced alignment, and mispronunciation detection). 
2. [spoke-client](https://github.com/psaylor/spoke-client "the spoke-client repo"): a JavaScript client-side library and framework with a set of tools for building front-end speech recognition websites (such as recording audio to a server, visualizing audio information, speech recognition through browser APIs).

Though Spoke was designed with the needs of the MIT Spoken Language Systems group in mind, it could easily be adopted by other researchers and developers hoping to incorporate their own speech technologies into functional websites.
