import * as THREE from "../threejs/build/three.module.js";
import { GLTFLoader } from '../threejs/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../threejs/examples/jsm/utils/SkeletonUtils.js';


let elThreejs = document.getElementById("threejs");
let camera,scene,renderer;
let axesHelper;

let keyboard = {};
let playerMesh;

let projectileMeshes = [];
let projectileMesh;

let animalMeshes = [];
let animalMesh;

let animalGLTF;
let mixers = [];
let clock;
init();

async function init() {

  // Scene
	scene = new THREE.Scene();

  // Camera
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.z = -10;
	// camera.position.z = 0;
	camera.position.y = 20;
  
	// rotate camera to see the scene from the top
	camera.rotation.x = -Math.PI / 2;

	const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
	ambient.position.set(0, 5, 0);
	scene.add(ambient);
  
	clock = new THREE.Clock();

  	// renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;


	// axesHelper = new THREE.AxesHelper( 100 );
	// scene.add( axesHelper );

	elThreejs.appendChild(renderer.domElement);

	await loadAnimal();

	addPlayer();
	addPlane();
	addProjectile();


	addKeysListener();
	animate();

	spawnAnimals();

}


function animate(){

	movePlayer();
	updateProjectiles();
	updateAnimals();


	// collision detection between projectile Meshes and animalMeshes
	checkCollisions();

	renderer.render(scene, camera);
	requestAnimationFrame(animate);

	const dt = clock.getDelta();
	for ( const mixer of mixers ) mixer.update( dt );
}

async function addPlayer(){
	const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );
	const playerGLTF = await gltfLoader.loadAsync( 'player.glb' );
	playerMesh = playerGLTF.scene.children[0];
	playerMesh.scale.set(0.3, 0.3, 0.3);
	playerMesh.rotation.set(Math.PI/3,3,6.4)


	playerMesh.position.set(0, 0, 0); // default
	scene.add(playerMesh);
}

	// adding 2D plane as background 
function addPlane(){
	const texture = new THREE.TextureLoader().load( "src/assets/Texture_Snow.png" );
	let geometry =  new THREE.BoxGeometry(50, 0, 50);
	let material = new THREE.MeshBasicMaterial({map: texture});
	let plane = new THREE.Mesh(geometry, material);
	plane.position.set(0, 0, -10);
	scene.add(plane);
  }

  	// recieving keybored events
function addKeysListener(){
	window.addEventListener('keydown', function(event){
	  keyboard[event.keyCode] = true;
	} , false);
	window.addEventListener('keyup', function(event){
	  keyboard[event.keyCode] = false;
	} , false);

	window.addEventListener("keyup", (event) => {
		// boiler plate code to prevent side effects
		if (event.isComposing || event.keyCode === 229) {
		  return;
		}
	
		// spacebar 
		if (event.keyCode == 32) {
		  let projectileMeshClone = projectileMesh.clone();
		  projectileMeshClone.position.x = playerMesh.position.x;
		  projectileMeshClone.position.y = playerMesh.position.y;
		  projectileMeshClone.position.z = playerMesh.position.z;
		  scene.add(projectileMeshClone);
		  projectileMeshes.push(projectileMeshClone);
		}
	  });
}


function movePlayer(){
	// left - A Key
	if(keyboard[65] && playerMesh.position.x > -15) playerMesh.position.x -= 0.25;
	// right - D Key
	if(keyboard[68] && playerMesh.position.x < 15) playerMesh.position.x += 0.25;
}

	// adding projectile
async function addProjectile(){
	const gltfLoader = new GLTFLoader().setPath( 'src/assets/' );
	const projectileGLTF = await gltfLoader.loadAsync( 'carrot.glb' );
	projectileMesh = projectileGLTF.scene;
	projectileMesh.scale.set(0.004, 0.004, 0.004);
	projectileMesh.rotation.set(Math.PI/2,0,-1.6)
}

function updateProjectiles(){
	projectileMeshes.forEach((projectile, index) => {
		projectile.position.z -= 0.5;
		if(projectile.position.z < -20){
			scene.remove(projectile);
			projectileMeshes.splice(index, 1);
		  }
	});
}

async function loadAnimal(){
	const gltfLoader = new GLTFLoader().setPath('src/assets/');
	animalGLTF = await gltfLoader.loadAsync( 'moose.glb' );
}


function addAnimal(posX){
	let model1 = SkeletonUtils.clone(animalGLTF.scene);

	let animations = {};
	animalGLTF.animations.forEach( animation => {
	  animations[animation.name] = animation;
	});

	let actualAnimation = "MooseAnimation";
	const mixer1 = new THREE.AnimationMixer(model1);
	mixer1.clipAction(animations[actualAnimation]).play();
  
	model1.position.x = posX;
	model1.position.y = 0;
	model1.position.z = -30;

	animalMeshes.push(model1);
	scene.add(model1);
	mixers.push(mixer1);
}

function spawnAnimals(){
	// random number between -20 and 20
	let randomX = Math.floor(Math.random() * 20) - 10;
	addAnimal(randomX);
	setInterval(() => {
		randomX = Math.floor(Math.random() * 20) - 10;
		addAnimal(randomX);
	}, 2000);
  }
  	//removing animal from scene
function updateAnimals(){
	animalMeshes.forEach((animal, index) => {
		animal.position.z += 0.15;
		if(animal.position.z > 0){
		  scene.remove(animal);
		  animalMeshes.splice(index, 1);
		}
	});
}
  
	//removing animmal and projectile after collision 
function checkCollisions(){
	animalMeshes.forEach((animal, indexa) => {
		projectileMeshes.forEach((projectile, indexb) => {
			if( animal.position.x >= projectile.position.x - 1 &&
				animal.position.x <= projectile.position.x + 1 &&
				animal.position.z >= projectile.position.z - 1 &&
				animal.position.z <= projectile.position.z + 1){
					scene.remove(animal);
					animalMeshes.splice(indexa, 1);
					scene.remove(projectile);
					projectileMeshes.splice(indexb, 1);
			}
		});
	});
}

