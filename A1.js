// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

var start = Date.now();
// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(10,5,10);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

// FLOOR WITH CHECKERBOARD
var floorTexture = new THREE.ImageUtils.loadTexture('images/tile.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;
scene.add(floor);

// TRANSFORMATIONS

function multMat(m1, m2){
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m){
  return new THREE.Matrix4().getInverse(m, true);
}

// dans les implementations des matrices chaque ligne dans le code est une colone.

function idMat4() {
  // Create Identity matrix
  var m = new THREE.Matrix4();
  m.set (
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  );
  return m;
}

function translateMat(matrix, x, y, z) {
  // Apply translation [x, y, z] to @matrix
  // matrix: THREE.Matrix4
  // x, y, z: float

  // TODO
  var m = new THREE.Matrix4();
  m.set(
    1,0,0,x,
    0,1,0,y,
    0,0,1,z,
    0,0,0,1
  );
  return multMat(m, matrix);
}

function rotateMat(matrix, angle, axis){
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix3
  // angle: float
  // axis: string "x", "y" or "z"
  
  // TODO
  let rotationMatrix = new THREE.Matrix4();
  if (axis == "x") {
      rotationMatrix.set(
        1,0,0,0,
        0,Math.cos(angle),-Math.sin(angle), 0,
        0,Math.sin(angle),Math.cos(angle), 0,
        0,0,0,1
      );
  }
  if (axis == "y") {
      rotationMatrix.set(
        Math.cos(angle),0,Math.sin(angle),0,
        0,1,0,0,
        -Math.sin(angle),0,Math.cos(angle),0,
        0,0,0,1
      );
  }
  if (axis == "z") {
      rotationMatrix.set(
        Math.cos(angle),-Math.sin(angle),0,0,
        Math.sin(angle),Math.cos(angle),0,0,
        0,0,1,0,
        0,0,0,1
      );
  }
  return multMat(rotationMatrix, matrix);
}

function rotateVec3(v, angle, axis){
  // Apply rotation by @angle with respect to @axis to vector @v
  // v: THREE.Vector3
  // angle: float
  // axis: string "x", "y" or "z"
  
  // TODO
  let rotationMatrix = new THREE.Matrix4();
  if (axis == "x") {
      rotationMatrix.set(
        1,0,0,0,
        0,Math.cos(angle),-Math.sin(angle), 0,
        0,Math.sin(angle),Math.cos(angle), 0,
        0,0,0,1
      );
  }
  if (axis == "y") {
      rotationMatrix.set(
        Math.cos(angle),0,Math.sin(angle),0,
        0,1,0,0,
        -Math.sin(angle),0,Math.cos(angle),0,
        0,0,0,1
      );
  }
  if (axis == "z") {
      rotationMatrix.set(
        Math.cos(angle),-Math.sin(angle),0,0,
        Math.sin(angle),Math.cos(angle),0,0,
        0,0,1,0,
        0,0,0,1
      );
  }
  return v.applyMatrix4(rotationMatrix);
}

function rescaleMat(matrix, x, y, z){
  // Apply scaling @x, @y and @z to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float
  
  // TODO
  let scalingMatrix = new THREE.Matrix4().set(
    x,0,0,0,
    0,y,0,0,
    0,0,z,0,
    0,0,0,1
  )
  return multMat(scalingMatrix, matrix);
}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;
    // Add parameters for parts
    // TODO
    // avant bras
    this.armRadius = 0.2;
    this.farmRadius = 0.15;
    this.thighRadius = 0.35;
    this.calfRadius = 0.25;

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  // initialize matrices for parts 
  initialTorsoMatrix(){
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight/2, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  //------------------------------- INIT OTHER PARTS ------------------------------------------------------

  // arms
  initialLeftArmMatrix(){
    // local space transformations?
    var initialLeftArmMatrix = idMat4(); 
    initialLeftArmMatrix = rescaleMat(initialLeftArmMatrix, 1, 2, 1);
    initialLeftArmMatrix = translateMat(initialLeftArmMatrix, 0, 2*this.armRadius, 0); // local transformation??
    return initialLeftArmMatrix;
  }

  initialRightArmMatrix(){
    var initialRightArmMatrix = idMat4();
    initialRightArmMatrix = rescaleMat(initialRightArmMatrix, 1, 2, 1);
    initialRightArmMatrix = translateMat(initialRightArmMatrix, 0, 2*this.armRadius, 0);
    return initialRightArmMatrix;
  }

  // forearms
  initialLeftFarmMatrix(){
    var initialLeftFarmMatrix = idMat4();
    initialLeftFarmMatrix = rescaleMat(initialLeftFarmMatrix, 1, 2, 1);
    initialLeftFarmMatrix = translateMat(initialLeftFarmMatrix, 0, 2*this.farmRadius, 0);
    return initialLeftFarmMatrix;
  }

  initialRightFarmMatrix(){
    var initialRightFarmMatrix = idMat4();
    initialRightFarmMatrix = rescaleMat(initialRightFarmMatrix, 1, 2, 1);
    initialRightFarmMatrix = translateMat(initialRightFarmMatrix, 0, 2*this.farmRadius, 0);
    return initialRightFarmMatrix;
  }

  //-------------------------------------------------------------------------------------------------------------

  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    // Add parts 
    //TODO 

    // arms (can we use one geometry for both??)
    var armGeometry = new THREE.SphereGeometry(this.armRadius, 64, 32);
    this.leftArm = new THREE.Mesh(armGeometry, this.material);
    this.rightArm = new THREE.Mesh(armGeometry, this.material);

    // forearms
    var farmGeometry = new THREE.SphereGeometry(this.farmRadius, 64, 32);
    this.leftFarm = new THREE.Mesh(farmGeometry, this.material);
    this.rightFarm = new THREE.Mesh(farmGeometry, this.material);

    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);
    // Add transformations
    // TODO
    
    // arms (world space transformations? or relative to torso?) // should I bind all of them to the torso?
    this.leftArmInitialMatrix = this.initialLeftArmMatrix();
    this.leftArmInitialMatrix = translateMat(this.leftArmInitialMatrix, this.torsoRadius + this.armRadius, 0, 0);
    this.leftArmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.leftArmInitialMatrix);
    this.leftArm.setMatrix(matrix);

    this.rightArmInitialMatrix = this.initialRightArmMatrix();
    this.rightArmInitialMatrix= translateMat(this.rightArmInitialMatrix, -(this.torsoRadius + this.armRadius), 0, 0);
    this.rightArmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.rightArmInitialMatrix);
    this.rightArm.setMatrix(matrix); // used later for locking arms to torso...

    this.leftFarmInitialMatrix = this.initialLeftFarmMatrix();
    this.leftFarmInitialMatrix = translateMat(this.leftFarmInitialMatrix, this.torsoRadius + this.armRadius, -2*this.armRadius - this.farmRadius/2, 0);
    this.leftFarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.leftFarmInitialMatrix);
    this.leftFarm.setMatrix(matrix);

    this.rightFarmInitialMatrix = this.initialRightFarmMatrix();
    this.rightFarmInitialMatrix = translateMat(this.rightFarmInitialMatrix, -(this.torsoRadius + this.armRadius), -2*this.armRadius - this.farmRadius/2, 0);
    this.rightFarmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.rightFarmInitialMatrix);
    this.rightFarm.setMatrix(matrix);



	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    // Add parts
    // TODO
    scene.add(this.leftArm);
    scene.add(this.rightArm);
    scene.add(this.leftFarm);
    scene.add(this.rightFarm);
  }

  rotateTorso(angle){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    var tempTorsoMatrix = matrix; // temp variable holding the matrix of the torso for other uses
    this.torso.setMatrix(matrix); // this is the torso matrix to which we should attach some pieces (arms and thighs)

    // head
    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");

    //TODO
    //lock other parts onto the torso (CHECK FOR ERRORS WITH WRONG BINDING)
    var m3 = multMat(this.leftArmMatrix, this.leftArmInitialMatrix);
    var m4 = multMat(this.rightArmMatrix, this.rightArmInitialMatrix);
    var m5 = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    var m6 = multMat(this.rightFarmMatrix, this.rightFarmInitialMatrix);

    matrix = multMat(tempTorsoMatrix, m3);
    this.leftArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m4);
    this.rightArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m5);
    this.leftFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m6);
    this.rightFarm.setMatrix(matrix);

  }

  moveTorso(speed){
    this.torsoMatrix = translateMat(this.torsoMatrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);

    var matrix = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    var tempTorsoMatrix = matrix;
    this.torso.setMatrix(matrix);

    // head
    var matrix2 = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(matrix, matrix2);
    this.head.setMatrix(matrix);

    // TODO
    //(CHECK FOR BINDING ERRORS)
    var m3 = multMat(this.leftArmMatrix, this.leftArmInitialMatrix);
    var m4 = multMat(this.rightArmMatrix, this.rightArmInitialMatrix);
    var m5 = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    var m6 = multMat(this.rightFarmMatrix, this.rightFarmInitialMatrix);

    matrix = multMat(tempTorsoMatrix, m3);
    this.leftArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m4);
    this.rightArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m5);
    this.leftFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m6);
    this.rightFarm.setMatrix(matrix);

  }

  rotateHead(angle){
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.head.setMatrix(matrix);
  }

  // Add methods for other parts
  // TODO

  look_at(point){
    // Compute and apply the correct rotation of the head and the torso for the robot to look at @point
      //TODO
  }
}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  // Add parts names
  // TODO
  ""
];
var numberComponents = components.length;

//MOUSE EVENTS
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var sphere = null;

document.addEventListener('mousemove', onMouseMove, false);

var isRightButtonDown = false;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")){
    selectedRobotComponent = selectedRobotComponent + 1;

    if (selectedRobotComponent<0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")){
    selectedRobotComponent = selectedRobotComponent - 1;

    if (selectedRobotComponent < 0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(-0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1);
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1);
        break;
      // Add more cases
      // TODO
    }
    }

    if (keyboard.pressed("f")) {
        isRightButtonDown = true;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);

        vector.unproject(camera);

        var dir = vector.sub(camera.position).normalize();

        raycaster.ray.origin.copy(camera.position);
        raycaster.ray.direction.copy(dir);

        var intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            if (!sphere) {
                var geometry = new THREE.SphereGeometry(0.1, 32, 32);
                var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
            }
        }

        updateLookAtPosition();
    }
    else{
        isRightButtonDown = false;

        if (sphere) {
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
            sphere = null;
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    if (isRightButtonDown) {
        updateLookAtPosition();
    }
}

function updateLookAtPosition() {
    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);

    vector.unproject(camera);

    var dir = vector.sub(camera.position).normalize();

    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.direction.copy(dir);

    var intersects = raycaster.intersectObjects(scene.children.filter(obj => obj !== sphere), true);

    if (intersects.length > 0) {
        var intersect = intersects[0]
        sphere.position.copy(intersect.point);
        robot.look_at(intersect.point);
    }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();
