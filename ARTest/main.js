// Get config from URL
var config = (function() {
  var config = {};
  var q = window.location.search.substring(1);
  if (q === '') {
    return config;
  }
  var params = q.split('&');
  var param, name, value;
  for (var i = 0; i < params.length; i++) {
    param = params[i].split('=');
    name = param[0];
    value = param[1];

    // All config values are either boolean or float
    config[name] = value === 'true' ? true :
                   value === 'false' ? false :
                   parseFloat(value);
  }
  return config;
})();

// Mock VRFrameData for VRControls
function VRFrameData () {
  this.leftViewMatrix = new Float32Array(16);
  this.rightViewMatrix = new Float32Array(16);
  this.leftProjectionMatrix = new Float32Array(16);
  this.rightProjectionMatrix = new Float32Array(16);
  this.pose = null;
};

console.log('creating CardboardVRDisplay with options', config);
var vrDisplay = new CardboardVRDisplay(config);

navigator.getVRDisplays = function () {
  return new Promise(function (resolve) {
    resolve([vrDisplay]);
  });
};

var canvas = document.querySelector('canvas');
// Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
// Only enable it if you actually need to.
var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
renderer.setPixelRatio(Math.floor(window.devicePixelRatio));

// Create a three.js scene.
var scene = new THREE.Scene();

// Create a three.js camera.
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

// Apply VR headset positional data to camera.
var controls = new THREE.VRControls(camera);

// Apply VR stereo rendering to renderer.
var effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// Skipping skybox grid

// Kick off the render loop.
vrDisplay.requestAnimationFrame(animate);

// Create 3D objects.
var cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // three.js line 29094
var sphereGeometry = new THREE.SphereGeometry(0.25, 32, 32); //three.js line 29075
var material = new THREE.MeshPhongMaterial({ color: 0xCD853F });
var cube = new THREE.Mesh(cubeGeometry, material);
var cube2 = new THREE.Mesh(cubeGeometry, material);
var sphere = new THREE.Mesh(sphereGeometry, material);

// create arToolkitSource
arToolkitSource = new THREEx.ArToolkitSource({
    sourceType : 'webcam',
});

function onResize()
{
    arToolkitSource.onResize()	
    arToolkitSource.copySizeTo(renderer.domElement)	
    if ( arToolkitContext.arController !== null )
    {
        arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
    }	
}

arToolkitSource.init(function onReady(){
    onResize()
});

// handle resize event
window.addEventListener('resize', function(){
    onResize()
});

// create arToolkitContext
arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'data/camera_para.dat',
    detectionMode: 'mono'
});

// copy projection matrix to camera when initialization complete
arToolkitContext.init();// function onCompleted(){
//    camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
//});

// Adding the AR markerControls
markerRoot1 = new THREE.Group();
scene.add(markerRoot1);
let markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
	type: 'pattern', patternUrl: "data/hiro.patt",
})

//this allows for phong to occur
{
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);
}

// this adds fog
{
  const near = 0;
  const far = 2;
  const color = 'lightblue';
  scene.fog = new THREE.Fog(color, near, far);
  scene.background = new THREE.Color(color);
}

// Position cube mesh
//cube.position.z = -1;
//sphere.position.y = 1;

// Add cube mesh to your three.js scene

//scene.add(cube);
//scene.add(sphere);

let mainGroup = new THREE.Group();
cube2.position.x -= 0.7;
sphere.position.y += 0.4
mainGroup.add(cube);
mainGroup.add(cube2);
mainGroup.add(sphere);

scene.add(mainGroup);

// Request animation frame loop function
var lastRender = 0;
function animate(timestamp) {
  if ( arToolkitSource.ready !== false ) {
    arToolkitContext.update( arToolkitSource.domElement );
    arToolkitSource.domElement.display = "none";
  }

  var delta = Math.min(timestamp - lastRender, 500);
  lastRender = timestamp;

  // Apply rotation to cube mesh
  cube.rotation.y += delta * 0.0006;

  mainGroup.position.x = -0.1*markerRoot1.position.x;
  mainGroup.position.y = 0.1*markerRoot1.position.y;
  mainGroup.position.z = -0.5+0.1*markerRoot1.position.z;
  mainGroup.rotation.x = -markerRoot1.rotation.x;
  mainGroup.rotation.y = -markerRoot1.rotation.y;
  mainGroup.rotation.z = -markerRoot1.rotation.z;
  mainGroup.matrix = markerRoot1.matrix;

  // Update VR headset position and apply to camera.
  controls.update();

  // Render the scene.
  effect.render(scene, camera);

  // Keep looping.
  vrDisplay.requestAnimationFrame(animate);
  
  //console.log(markerRoot1.position);
}

function onResize() {
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onVRDisplayPresentChange() {
  console.log('onVRDisplayPresentChange');
  onResize();
}

// Resize the WebGL canvas when we resize and also when we change modes.
window.addEventListener('resize', onResize);
window.addEventListener('vrdisplaypresentchange', onVRDisplayPresentChange);

// Button click handlers.
document.querySelector('button#fullscreen').addEventListener('click', function() {
  enterFullscreen(canvas);
});
document.querySelector('button#vr').addEventListener('click', function() {
  vrDisplay.requestPresent([{source: canvas }]);
});
document.querySelector('button#reset').addEventListener('click', function() {
  vrDisplay.resetPose();
});

function enterFullscreen (el) {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}