import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as dat from "https://cdn.jsdelivr.net/npm/lil-gui@0.16.0/dist/lil-gui.esm.min.js";

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Textures
const bricksTextures = {
  color: textureLoader.load("./Texture/bricks/color.jpg"),
  ao: textureLoader.load("./Texture/bricks/ambientOcclusion.jpg"),
  normal: textureLoader.load("./Texture/bricks/normal.jpg"),
  roughness: textureLoader.load("./Texture/bricks/roughness.jpg"),
};

const doorTextures = {
  color: textureLoader.load("./Texture/door/color.jpg"),
  alpha: textureLoader.load("./Texture/door/alpha.jpg"),
  ao: textureLoader.load("./Texture/door/ambientOcclusion.jpg"),
  height: textureLoader.load("./Texture/door/height.jpg"),
  normal: textureLoader.load("./Texture/door/normal.jpg"),
  metalness: textureLoader.load("./Texture/door/metalness.jpg"),
  roughness: textureLoader.load("./Texture/door/roughness.jpg"),
};

const grassTextures = {
  color: textureLoader.load("./Texture/grass/color.jpg"),
  ao: textureLoader.load("./Texture/grass/ambientOcclusion.jpg"),
  normal: textureLoader.load("./Texture/grass/normal.jpg"),
  roughness: textureLoader.load("./Texture/grass/roughness.jpg"),
};

Object.values(grassTextures).forEach((texture) => {
  texture.repeat.set(8, 8);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
});

const spinControl = {
  isSpinning: false, // Toggle spinning
  spinSpeed: 0.01, // Default spin speed
};

// Parameters for light rotation
const lightParams = { angle: 0, distance: 5 };

let canvas;

let scene, sizes, camera, controls, renderer;

let gui;

let house, roof, walls, door, floor;

let isNight = false; // Default to day mode

let doorLight, ambientLight, dayAndNightLight;

init();
animate();

function init() {
  // Canvas
  canvas = document.querySelector("canvas.webgl");

  // Scene
  scene = new THREE.Scene();

  // House container
  house = new THREE.Group();
  scene.add(house);

  // Roof
  roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1, 4),
    new THREE.MeshStandardMaterial({ color: "#b35f45" })
  );
  roof.rotation.y = Math.PI * 0.25;
  roof.position.y = 2.5 + 0.5;
  house.add(roof);

  // Walls
  walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    new THREE.MeshStandardMaterial({
      map: bricksTextures.color,
      aoMap: bricksTextures.ao,
      normalMap: bricksTextures.normal,
      roughnessMap: bricksTextures.roughness,
    })
  );
  walls.geometry.setAttribute(
    "uv2",
    new THREE.Float32BufferAttribute(walls.geometry.attributes.uv.array, 2)
  );
  walls.position.y = 1.25;
  walls.castShadow = true;
  house.add(walls);

  // Door
  door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
    new THREE.MeshStandardMaterial({
      map: doorTextures.color,
      transparent: true,
      alphaMap: doorTextures.alpha,
      aoMap: doorTextures.ao,
      displacementMap: doorTextures.height,
      displacementScale: 0.1,
      normalMap: doorTextures.normal,
      metalnessMap: doorTextures.metalness,
      roughnessMap: doorTextures.roughness,
    })
  );
  door.geometry.setAttribute(
    "uv2",
    new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2)
  );
  door.position.y = 1;
  door.position.z = 2 + 0.01;
  house.add(door);

  // Door light
  doorLight = new THREE.PointLight("#ff7d46");
  doorLight.position.set(0, 2.1, 3);
  doorLight.castShadow = true;
  doorLight.shadow.mapSize.set(256, 256);
  doorLight.shadow.camera.far = 7;
  house.add(doorLight);

  // Floor
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
      map: grassTextures.color,
      aoMap: grassTextures.ao,
      normalMap: grassTextures.normal,
      roughnessMap: grassTextures.roughness,
    })
  );
  floor.geometry.setAttribute(
    "uv2",
    new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2)
  );
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Lights
  // Ambient light
  ambientLight = new THREE.AmbientLight("#b9d5ff", 0.12);

  scene.add(ambientLight);

  // Directional light
  dayAndNightLight = new THREE.DirectionalLight("#b9d5ff", 0.12);
  dayAndNightLight.castShadow = true;
  dayAndNightLight.shadow.mapSize.set(256, 256);
  dayAndNightLight.shadow.camera.far = 15;
  scene.add(dayAndNightLight);

  const directionalLightCameraHelper = new THREE.CameraHelper(
    dayAndNightLight.shadow.camera
  );
  directionalLightCameraHelper.visible = true;
  scene.add(directionalLightCameraHelper);

  toggleDayNight();

  sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Camera
  // Base camera
  camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.x = 4;
  camera.position.y = 2;
  camera.position.z = 10;
  scene.add(camera);

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  GUIs();
}

function GUIs() {
  // GUI
  gui = new dat.GUI();
  gui.close();

  const lightPosition = gui.addFolder("Lighting");
  lightPosition.add(ambientLight, "intensity").min(0).max(1).step(0.001);
  lightPosition.add(dayAndNightLight, "intensity").min(0).max(1).step(0.001);

  lightPosition.add(dayAndNightLight.position, "x").min(-5).max(5).step(0.001);
  lightPosition.add(dayAndNightLight.position, "y").min(-5).max(5).step(0.001);
  lightPosition.add(dayAndNightLight.position, "z").min(-5).max(5).step(0.001);

  gui.add({ toggleDayNight }, "toggleDayNight").name("Toggle Day/Night");

  gui.add(spinControl, "isSpinning").name("Spin light");
}

function toggleDayNight() {
  isNight = !isNight;

  if (isNight) {
    // Night mode
    scene.background = new THREE.Color(0x0a0f29);
    dayAndNightLight.position.set(-5, 6.5, 5);

    dayAndNightLight.color.set("#8a8ac7");
    dayAndNightLight.intensity = 0.2;

    doorLight.intensity = 4; // Make the door light more prominent at night
  } else {
    // Day mode
    scene.background = textureLoader.load("./Texture/Daylight.jpg");
    dayAndNightLight.position.set(5, 6.5, -5);

    dayAndNightLight.color.set("#ffffff");
    dayAndNightLight.intensity = 0.12;

    doorLight.intensity = 0; // Reduce the door light during the day
  }
}

function animate() {
  const clock = new THREE.Clock();

  // This is your main animation loop
  const elapsedTime = clock.getElapsedTime();

  if (spinControl.isSpinning) {
    lightParams.angle += 0.02; // Adjust the speed of spinning
    dayAndNightLight.position.x =
      lightParams.distance * Math.cos(lightParams.angle);
    dayAndNightLight.position.z =
      lightParams.distance * Math.sin(lightParams.angle);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(animate);
}
