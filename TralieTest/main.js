//Get config from URL
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

//var WIDTH = 400;
//var HEIGHT = 225;
var canvas = document.querySelector('canvas');

const renderer = new THREE.WebGLRenderer({antialias: false, canvas: canvas});
renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Apply VR headset positional data to camera.
const controls = new THREE.VRControls(camera);

// Apply VR stereo rendering to renderer.
var effect = new THREE.VREffect(renderer);
effect.setSize(WIDTH, HEIGHT);

// Add a repeating grid as a skybox.
var boxWidth = 5;
var loader = new THREE.TextureLoader();
loader.load('img/box.png', onTextureLoaded);

// Kick off the render loop.
vrDisplay.requestAnimationFrame(animate);

function onTextureLoaded(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(boxWidth, boxWidth);
  
    var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);
    var material = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0x01BE00,
      side: THREE.BackSide
    });
  
    var skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);
}

//Code from Tralie.html
const geometry = new THREE.BoxGeometry(3,3,3);
            
const loader = new THREE.TextureLoader(); //allows for images to be used
const material = new THREE.MeshBasicMaterial({
    map: loader.load('images/tralie.jpg'),
})
            
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

// this adds fog
{
    const near = 2;
    const far = 6;
    const color = 'lightblue';
    scene.fog = new THREE.Fog(color, near, far);
    scene.background = new THREE.Color(color);
}

const animate = function () {
    var delta = Math.min(timestamp - lastRender, 500);
    lastRender = timestamp;

    // Apply rotation to cube mesh
    cube.rotation.y += delta * 0.0006;

    // Update VR headset position and apply to camera.
    controls.update();

    // Render the scene.
    effect.render(scene, camera);

    // Keep looping.
    vrDisplay.requestAnimationFrame(animate);
};

//animate();

function onResize() {
    effect.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
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