# web-demo-viewer

based on a project that uncrafted has already made

how to use (i promise i'll make it easier to use in the future):
1. download the code
2. go into the map of your choice and noclip to the center of the map
3. run these commands: crosshair 0; cl_showpos 0; r_drawviewmodel 0; camortho; cl_pitchup 89.999; cl_pitchdown 89.999; c_orthowidth 2500; c_orthoheight 1406; gl_clear 1
4. adjust c_orthowidth until the entire map fits and multiply that with 9/16 (or whatever your aspect ratio is) and set that as your c_orthoheight
5. take a screenshot and put it in the same folder you put your code in
6. reload the game and go back into the chamber and find a spot that you can easily notice that's relatively far away from the player diagonally (should be in front of the starting elevator) and note down its coordinates 
7. go into index.html and change the src of the image tag to your screenshot
8. go into script.js and enter your map name in the same pattern as the other ones are in. set otherXInGame to the x coordinate you noted down earlier and the same with the y coordinate. width should be your c_orthowidth
9. change chamberName to that of your chamber
10. open index.html in your favorite browser and click on wherever your player will spawn (probably the elevator) and the spot you chose out earlier
11. load the demo(s) of your choosing and hope that it works!
