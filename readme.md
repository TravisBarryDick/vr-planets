# vr-planets

This project is a simple simulation of a planetary system in virtual reality for
use with the Oculus Quest, Rift, or Rift S (or any device compatible with the
`oculus-touch-controls` A-Frame component). The user can create a new planet by
pressing the `a` button. If the `a` button is held, then the user can drag their
right hand through space to set the initial velocity of the newly created
planet. A live demo is available here:
https://travisbarrydick.github.io/vr-planets/dist/. You can use WSAD and the
mouse to move the camera, but you can only create new planets using the oculus
touch controls.

Currently the planet motion is simulated using the Eulerian method.

![Screenshot](screenshot.png?raw=true)
