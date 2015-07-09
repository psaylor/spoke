# spoke
The spoke project is Spoke's server-side library that interfaces with custom speech technologies and provides a utility-belt of audio tools such as recording, transcoding, and playback. [spoke][1] can be used as a standalone processing library or in conjunction with [spoke-client][2] to build websites.

# Spoke
Spoke is a framework for building interactive speech-enabled web applications. It leverages modern web technologies such as the Web Audio APIs, WebSockets, and Node.js to provide a standardized and streamlined way to build website demos featuring one's own spoken language technologies on the backend. 

Though Spoke was designed with the needs of the MIT Spoken Language Systems group in mind, it could easily be adopted by other researchers and developers hoping to incorporate their own speech technologies into functional websites.


Spoke consists of two components (each their own project with github repo) that should be used in conjunction to build web applications:

1. [spoke][1]: a Node.js server-side library with a set of modules that interface with a handful of custom speech technologies (such as speech recognition, forced alignment, and mispronunciation detection). 
2. [spoke-client][2]: a JavaScript client-side library and framework with a set of tools for building front-end speech recognition websites (such as recording audio to a server, visualizing audio information, speech recognition through browser APIs).

![Spoke module overview][Spoke_module_overview]

For more on [spoke][1], keep reading. [spoke-client][2] is explained in more detail on its own page.

## Overview
spoke, the server-side library of Spoke, provides two types of modules-**audio utilities** and **speech technologies**-geared towards building a speech processing backend for a server, but the library can also be used for offline scripting and batch processing. As a library, not a framework, it is up to the developer to listen for client events and then decide which pieces of the library to use. The library’s utilities enable recording raw or wav audio, transcoding audio files or live audio streams, and streaming audio from a saved file. The library also provides standardized access to and usage of some speech technologies built in the lab, such as 
* domain-specific speech recognizers
* forced alignment of an audio sample to expected text
* mispronunciation detection on a set of utterances from the same speaker



[1]:https://github.com/psaylor/spoke "the spoke repo"
[2]:https://github.com/psaylor/spoke-client "the spoke-client repo"
[Spoke_module_overview]: https://github.com/psaylor/spoke-client/blob/gh-pages/images/Spoke_module_overview.png "Spoke module overview"
