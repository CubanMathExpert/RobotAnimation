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
  let scalingMatrix = new THREE.Matrix4().set(
    x,0,0,0,
    0,y,0,0,
    0,0,z,0,
    0,0,0,1
  )
  return multMat(scalingMatrix, matrix);
}
var lastCalledTime;
var fps;

function requestAnimFrame() {

  if(!lastCalledTime) {
     lastCalledTime = Date.now();
     fps = 0;
     return;
  }
  delta = (Date.now() - lastCalledTime)/1000;
  lastCalledTime = Date.now();
  fps = 1/delta;
}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;
    this.armRadius = 0.2;
    this.farmRadius = 0.15;
    this.thighRadius = 0.25;
    this.calfRadius = 0.18;
    // rotation containers (maybe)

    this.x_currentLeftArmAngle = 0;
    this.x_currentRightArmAngle = 0

    this.x_currentLeftFarmAngle = 0;
    this.x_currentRightFarmAngle = 0;

    this.x_currentLeftThighAngle = 0;
    this.x_currentRightThighAngle = 0;

    this.x_currentLeftCalfAngle = 0;
    this.x_currentRightCalfAngle = 0;
    this.x_currentHeadRotation= 0;  // Initial pitch 
    this.y_currentHeadRotation = 0;  // Initial yaw 

    this.thighAnimAngle = 0.05;
    this.calfAnimAngle = 0.05;
    this.armAnimAngle = 0.05;

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
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight/2 + 4*this.thighRadius + 4*this.calfRadius, 0); 

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
    var initialLeftArmMatrix = idMat4(); 
    initialLeftArmMatrix = translateMat(initialLeftArmMatrix, this.torsoRadius + this.armRadius, this.armRadius, 0); // local transformation??
    initialLeftArmMatrix = rescaleMat(initialLeftArmMatrix, 1, 2, 1)
    return initialLeftArmMatrix;
  }

  initialRightArmMatrix(){
    var initialRightArmMatrix = idMat4();
    initialRightArmMatrix = translateMat(initialRightArmMatrix, -(this.torsoRadius + this.armRadius), this.armRadius, 0);
    initialRightArmMatrix = rescaleMat(initialRightArmMatrix, 1, 2, 1);
    return initialRightArmMatrix;
  }

  // forearms
  initialLeftFarmMatrix(){
    var initialLeftFarmMatrix = idMat4();
    initialLeftFarmMatrix = translateMat(initialLeftFarmMatrix, this.torsoRadius + this.armRadius, -this.farmRadius, 0);
    initialLeftFarmMatrix = rescaleMat(initialLeftFarmMatrix, 1, 2, 1);
    return initialLeftFarmMatrix;
  }

  initialRightFarmMatrix(){
    var initialRightFarmMatrix = idMat4();
    initialRightFarmMatrix = translateMat(initialRightFarmMatrix, -(this.torsoRadius + this.armRadius), -this.farmRadius, 0);
    initialRightFarmMatrix = rescaleMat(initialRightFarmMatrix, 1, 2, 1);
    return initialRightFarmMatrix;
  }

  // thighs
  initialLeftThighMatrix(){
    var initialLeftThighMatrix = idMat4();
    initialLeftThighMatrix = translateMat(initialLeftThighMatrix, this.torsoRadius/2, -(this.torsoRadius/2 + this.thighRadius) , 0);
    initialLeftThighMatrix = rescaleMat(initialLeftThighMatrix, 1, 2, 1);
    return initialLeftThighMatrix;
  }

  initialRightThighMatrix(){
    var initialRightThighMatrix = idMat4();
    initialRightThighMatrix = translateMat(initialRightThighMatrix, -this.torsoRadius/2, -(this.torsoRadius/2 + this.thighRadius) , 0);
    initialRightThighMatrix = rescaleMat(initialRightThighMatrix, 1, 2, 1);
    return initialRightThighMatrix;
  }

  // calves
  initialLeftCalfMatrix(){
    var initialLeftCalfMatrix = idMat4();
    initialLeftCalfMatrix = rescaleMat(initialLeftCalfMatrix, 1, 2, 1);
    initialLeftCalfMatrix = translateMat(initialLeftCalfMatrix, this.torsoRadius/2, -this.torsoHeight/2 - 4*this.thighRadius - 2*this.calfRadius, 0);
    return initialLeftCalfMatrix;
  }

  initialRightCalfMatrix(){
    var initialRightCalfMatrix = idMat4();
    initialRightCalfMatrix = rescaleMat(initialRightCalfMatrix, 1, 2, 1);
    initialRightCalfMatrix = translateMat(initialRightCalfMatrix, -this.torsoRadius/2, -this.torsoHeight/2 - 4*this.thighRadius - 2*this.calfRadius, 0);
    
    
    return initialRightCalfMatrix;
  }

  //-------------------------------------------------------------------------------------------------------------

  initialize() { // (LOCAL SPACE I GUESS)
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

    //thighs
    var thighGeometry = new THREE.SphereGeometry(this.thighRadius, 64, 32);
    this.leftThigh = new THREE.Mesh(thighGeometry, this.material);
    this.rightThigh = new THREE.Mesh(thighGeometry, this.material);

    //calves
    var calfGeometry = new THREE.SphereGeometry(this.calfRadius, 64, 32);
    this.leftCalf = new THREE.Mesh(calfGeometry, this.material);
    this.rightCalf = new THREE.Mesh(calfGeometry, this.material);

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
    this.leftArmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.leftArmInitialMatrix);
    this.leftArm.setMatrix(matrix);
    this.leftArm.matri

    this.rightArmInitialMatrix = this.initialRightArmMatrix();
    this.rightArmMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.rightArmInitialMatrix);
    this.rightArm.setMatrix(matrix); // used later for locking arms to torso...

    // forearms
    this.leftFarmInitialMatrix = this.initialLeftFarmMatrix();
    this.leftFarmMatrix = idMat4(); // set initial position of left forearm
    var matrix = multMat(this.torsoInitialMatrix, this.leftFarmInitialMatrix);
    this.leftFarm.setMatrix(matrix);

    this.rightFarmInitialMatrix = this.initialRightFarmMatrix();
    this.rightFarmMatrix = idMat4(); 
    var matrix = multMat(this.torsoInitialMatrix, this.rightFarmInitialMatrix);
    this.rightFarm.setMatrix(matrix);

    // thighs
    this.leftThighInitialMatrix = this.initialLeftThighMatrix();
    this.leftThighMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.leftThighInitialMatrix);
    this.leftThigh.setMatrix(matrix);

    this.rightThighInitialMatrix = this.initialRightThighMatrix();
    this.rightThighMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.rightThighInitialMatrix);
    this.rightThigh.setMatrix(matrix);

    //calves
    this.leftCalfInitialMatrix = this.initialLeftCalfMatrix();
    this.leftCalfMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.leftCalfInitialMatrix);
    this.leftCalf.setMatrix(matrix);

    this.rightCalfInitialMatrix = this.initialRightCalfMatrix();
    this.rightCalfMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.rightCalfInitialMatrix);
    this.rightCalf.setMatrix(matrix);

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    // Add parts
    // TODO
    scene.add(this.leftArm);
    scene.add(this.rightArm);
    scene.add(this.leftFarm);
    scene.add(this.rightFarm);
    scene.add(this.leftThigh);
    scene.add(this.rightThigh);
    scene.add(this.leftCalf);
    scene.add(this.rightCalf);
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
    //lock other parts onto the torso 
    var m3 = multMat(this.leftArmMatrix, this.leftArmInitialMatrix);
    var m4 = multMat(this.rightArmMatrix, this.rightArmInitialMatrix);
    var m5 = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    var m6 = multMat(this.rightFarmMatrix, this.rightFarmInitialMatrix);
    var m7 = multMat(this.leftThighMatrix, this.leftThighInitialMatrix);
    var m8 = multMat(this.rightThighMatrix, this.rightThighInitialMatrix);
    var m9 = multMat(this.leftCalfMatrix, this.leftCalfInitialMatrix);
    var m10 = multMat(this.rightCalfMatrix, this.rightCalfInitialMatrix);

    matrix = multMat(tempTorsoMatrix, m3);
    this.leftArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m4);
    this.rightArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m5);
    this.leftFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m6);
    this.rightFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m7);
    this.leftThigh.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m8);
    this.rightThigh.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m9);
    this.leftCalf.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m10);
    this.rightCalf.setMatrix(matrix)

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
    var m7 = multMat(this.leftThighMatrix, this.leftThighInitialMatrix);
    var m8 = multMat(this.rightThighMatrix, this.rightThighInitialMatrix);
    var m9 = multMat(this.leftCalfMatrix, this.leftCalfInitialMatrix);
    var m10 = multMat(this.rightCalfMatrix, this.rightCalfInitialMatrix);

    matrix = multMat(tempTorsoMatrix, m3);
    this.leftArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m4);
    this.rightArm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m5);
    this.leftFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m6);
    this.rightFarm.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m7);
    this.leftThigh.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m8);
    this.rightThigh.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m9);
    this.leftCalf.setMatrix(matrix);

    matrix = multMat(tempTorsoMatrix, m10);
    this.rightCalf.setMatrix(matrix)

  }

  rotateHead(angle,axis){
    var headMatrix = this.headMatrix;

    // Save the current rotation
    if (axis === "x") 
      this.x_currentHeadRotation += angle;  
    else if (axis === "y") 
      this.y_currentHeadRotation += angle;
  
    this.headMatrix = idMat4();
    //translate to rotate
    this.headMatrix = translateMat(this.headMatrix, 0, -(this.torsoHeight/2+this.headRadius), 0);
    if (axis == "x")  this.headMatrix = rotateMat(this.headMatrix, angle, "x");
    else if (axis == "y") this.headMatrix = rotateMat(this.headMatrix, angle, "y");

    //translate back to original position
    this.headMatrix = translateMat(this.headMatrix, 0, (this.torsoHeight/2+this.headRadius), 0);
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    // reatach to the torso after transform 
    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.head.setMatrix(matrix);
  }

  rotateLeftArm(angle, axis) {
    this.x_currentLeftArmAngle += angle;

    var leftArmMatrix = this.leftArmMatrix;
    this.leftArmMatrix = idMat4();

    // arm transformation
    this.leftArmMatrix = translateMat(this.leftArmMatrix, 0, -this.torsoHeight/2, 0);
    if (axis == "z")
      this.leftArmMatrix = translateMat(this.leftArmMatrix, -(this.torsoRadius + this.armRadius), 0, 0);
    this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, axis);
    this.leftArmMatrix = translateMat(this.leftArmMatrix, 0, this.torsoHeight/2, 0); 
    if (axis == "z")
      this.leftArmMatrix = translateMat(this.leftArmMatrix, (this.torsoRadius + this.armRadius), 0, 0);
    this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);

    // reatach to the torso after transform
    var matrix = multMat(this.leftArmMatrix, this.leftArmInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.leftArm.setMatrix(matrix);

    // Forearm transformation to follow the arm
    this.leftFarmMatrix = idMat4();
    this.leftFarmMatrix = rotateMat(this.leftFarmMatrix, this.x_currentLeftFarmAngle, "x");

    // Apply the arm's transformation to the forearm
    this.leftFarmMatrix = multMat(this.leftArmMatrix, this.leftFarmMatrix);
    

    // Set the final transformation for the forearm in torso space
    var forearmMatrix = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    forearmMatrix = multMat(this.torsoMatrix, forearmMatrix);
    forearmMatrix = multMat(this.torsoInitialMatrix, forearmMatrix);

    // Apply the final transformation matrix to the forearm
    this.leftFarm.setMatrix(forearmMatrix);

  }

  rotateLeftFarm(angle){
    //forearm rotations will always be around x axis
    var leftFarmMatrix = this.leftFarmMatrix;
    this.leftFarmMatrix = idMat4();

    this.leftFarmMatrix = rotateMat(this.leftFarmMatrix, angle, "x");
    this.x_currentLeftFarmAngle += angle; // keep track of angle of distal limb
    this.leftFarmMatrix = multMat(leftFarmMatrix, this.leftFarmMatrix);

    var farmMatrix = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    farmMatrix = multMat(this.torsoMatrix, farmMatrix);
    farmMatrix = multMat(this.torsoInitialMatrix, farmMatrix);

    this.leftFarm.setMatrix(farmMatrix);

  }

  rotateRightArm(angle, axis) {
    this.x_currentRightArmAngle += angle;

    var rightArmMatrix = this.rightArmMatrix;
    this.rightArmMatrix = idMat4();

    // arm transformation
    this.rightArmMatrix = translateMat(this.rightArmMatrix, 0, -this.torsoHeight/2, 0);
    if (axis == "z")
      this.rightArmMatrix = translateMat(this.rightArmMatrix, (this.torsoRadius + this.armRadius), 0, 0);
    this.rightArmMatrix = rotateMat(this.rightArmMatrix, angle, axis);
    this.rightArmMatrix = translateMat(this.rightArmMatrix, 0, this.torsoHeight/2, 0); 
    if (axis == "z")
      this.rightArmMatrix = translateMat(this.rightArmMatrix, -(this.torsoRadius + this.armRadius), 0, 0);
    this.rightArmMatrix = multMat(rightArmMatrix, this.rightArmMatrix);

    // reatach to the torso after transform
    var matrix = multMat(this.rightArmMatrix, this.rightArmInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.rightArm.setMatrix(matrix);

    // Forearm transformation to follow the arm
    this.rightFarmMatrix = idMat4();
    this.rightFarmMatrix = rotateMat(this.rightFarmMatrix, this.x_currentRightFarmAngle, "x");

    // Apply the arm's transformation to the forearm
    this.rightFarmMatrix = multMat(this.rightArmMatrix, this.rightFarmMatrix);
    

    // Set the final transformation for the forearm in torso space
    var forearmMatrix = multMat(this.rightFarmMatrix, this.rightFarmInitialMatrix);
    forearmMatrix = multMat(this.torsoMatrix, forearmMatrix);
    forearmMatrix = multMat(this.torsoInitialMatrix, forearmMatrix);

    // Apply the final transformation matrix to the forearm
    this.rightFarm.setMatrix(forearmMatrix);

  }

  rotateRightFarm(angle){
    //forearm rotations will always be around x axis
    var rightFarmMatrix = this.rightFarmMatrix;
    this.rightFarmMatrix = idMat4();

    this.rightFarmMatrix = rotateMat(this.rightFarmMatrix, angle, "x");
    this.x_currentRightFarmAngle += angle; 
    this.rightFarmMatrix = multMat(rightFarmMatrix, this.rightFarmMatrix);

    var farmMatrix = multMat(this.rightFarmMatrix, this.rightFarmInitialMatrix);
    farmMatrix = multMat(this.torsoMatrix, farmMatrix);
    farmMatrix = multMat(this.torsoInitialMatrix, farmMatrix);

    this.rightFarm.setMatrix(farmMatrix);

  }

  rotateLeftThigh(angle){
    this.x_currentLeftThighAngle += angle;
    var leftThighMatrix = this.leftThighMatrix;
    this.leftThighMatrix = idMat4();

    //make the actual transform
    this.leftThighMatrix = translateMat(this.leftThighMatrix, 0, (this.torsoRadius/2 + this.thighRadius), 0);
    this.leftThighMatrix = rotateMat(this.leftThighMatrix, angle, "x");
    this.leftThighMatrix = translateMat(this.leftThighMatrix, 0, -(this.torsoRadius/2 + this.thighRadius), 0);
    this.leftThighMatrix = multMat(leftThighMatrix, this.leftThighMatrix);

    //reatach to torso and set matrix
    var thighMatrix = multMat(this.leftThighMatrix, this.leftThighInitialMatrix);
    thighMatrix = multMat(this.torsoMatrix, thighMatrix);
    thighMatrix = multMat(this.torsoInitialMatrix, thighMatrix);
    this.leftThigh.setMatrix(thighMatrix);

    // calf transformation to follow the thigh
    this.leftCalfMatrix = idMat4();
    this.leftCalfMatrix = translateMat(this.leftCalfMatrix, 0, this.torsoHeight/2 + 4*this.thighRadius , 0);
    this.leftCalfMatrix = rotateMat(this.leftCalfMatrix, this.x_currentLeftCalfAngle, "x");
    this.leftCalfMatrix = translateMat(this.leftCalfMatrix, 0, -this.torsoHeight/2 - 4*this.thighRadius , 0);
    this.leftCalfMatrix = multMat(this.leftThighMatrix, this.leftCalfMatrix);

    // Set the final transformation for the forearm in torso space
    var calfMatrix = multMat(this.leftCalfMatrix, this.leftCalfInitialMatrix);
    calfMatrix = multMat(this.torsoMatrix, calfMatrix);
    calfMatrix = multMat(this.torsoInitialMatrix, calfMatrix);

    //Set the final transformation matrix to the left thigh
    this.leftCalf.setMatrix(calfMatrix);
  }

  rotateLeftCalf(angle){
    var leftCalfMatrix = this.leftCalfMatrix;
    this.leftCalfMatrix = idMat4();
    //rotate around the right axis
    this.leftCalfMatrix = translateMat(this.leftCalfMatrix, 0, this.torsoHeight/2 + 4*this.thighRadius , 0);
    this.leftCalfMatrix = rotateMat(this.leftCalfMatrix, angle, "x");
    this.x_currentLeftCalfAngle += angle;
    this.leftCalfMatrix = translateMat(this.leftCalfMatrix, 0, -this.torsoHeight/2 - 4*this.thighRadius , 0);
    this.leftCalfMatrix = multMat(leftCalfMatrix, this.leftCalfMatrix);

    var calfMatrix = multMat(this.leftCalfMatrix, this.leftCalfInitialMatrix);
    calfMatrix = multMat(this.torsoMatrix, calfMatrix);
    calfMatrix = multMat(this.torsoInitialMatrix, calfMatrix);

    this.leftCalf.setMatrix(calfMatrix);
  }

  rotateRightThigh(angle){
    this.x_currentRightThighAngle += angle;
    //save previous transforms in new variable
    var rightThighMatrix = this.rightThighMatrix;
    this.rightThighMatrix = idMat4();

    //make the actual transform
    this.rightThighMatrix = translateMat(this.rightThighMatrix, 0, (this.torsoRadius/2 + this.thighRadius), 0);
    this.rightThighMatrix = rotateMat(this.rightThighMatrix, angle, "x");
    this.rightThighMatrix = translateMat(this.rightThighMatrix, 0, -(this.torsoRadius/2 + this.thighRadius), 0);
    this.rightThighMatrix = multMat(rightThighMatrix, this.rightThighMatrix);

    //reatach to torso and set matrix
    var thighMatrix = multMat(this.rightThighMatrix, this.rightThighInitialMatrix);
    thighMatrix = multMat(this.torsoMatrix, thighMatrix);
    thighMatrix = multMat(this.torsoInitialMatrix, thighMatrix);
    this.rightThigh.setMatrix(thighMatrix);

    // calf transformation to follow the thigh
    this.rightCalfMatrix = idMat4();
    this.rightCalfMatrix = translateMat(this.rightCalfMatrix, 0, this.torsoHeight/2 + 4*this.thighRadius , 0);
    this.rightCalfMatrix = rotateMat(this.rightCalfMatrix, this.x_currentRightCalfAngle, "x");
    this.rightCalfMatrix = translateMat(this.rightCalfMatrix, 0, -this.torsoHeight/2 - 4*this.thighRadius , 0);
    this.rightCalfMatrix = multMat(this.rightThighMatrix, this.rightCalfMatrix);
    
    //Final multiplications to set everything in place
    var calfMatrix = multMat(this.rightCalfMatrix, this.rightCalfInitialMatrix);
    calfMatrix = multMat(this.torsoMatrix, calfMatrix);
    calfMatrix = multMat(this.torsoInitialMatrix, calfMatrix);

    this.rightCalf.setMatrix(calfMatrix);
  }

  rotateRightCalf(angle){
    var rightCalfMatrix = this.rightCalfMatrix;
    this.rightCalfMatrix = idMat4();
    //rotate around the right axis
    this.rightCalfMatrix = translateMat(this.rightCalfMatrix, 0, this.torsoHeight/2 + 4*this.thighRadius , 0);
    this.rightCalfMatrix = rotateMat(this.rightCalfMatrix, angle, "x");
    this.x_currentRightCalfAngle += angle;
    this.rightCalfMatrix = translateMat(this.rightCalfMatrix, 0, -this.torsoHeight/2 - 4*this.thighRadius , 0);
    this.rightCalfMatrix = multMat(rightCalfMatrix, this.rightCalfMatrix);

    var calfMatrix = multMat(this.rightCalfMatrix, this.rightCalfInitialMatrix);
    calfMatrix = multMat(this.torsoMatrix, calfMatrix);
    calfMatrix = multMat(this.torsoInitialMatrix, calfMatrix);

    this.rightCalf.setMatrix(calfMatrix);
  }

  // the speeds are the swing speeds
  forwardWalkAnimation() {
    //initialforearm angle
    this.x_currentLeftFarmAngle = -Math.PI/4;
    this.x_currentRightFarmAngle = -Math.PI/4;

    let maxThighAngle = 0.6;
    let maxArmAngle = 0.5;
    
    // thighs
    robot.rotateLeftThigh(this.thighAnimAngle);
    robot.rotateRightThigh(-this.thighAnimAngle);
    if (this.x_currentRightThighAngle < -maxThighAngle || this.x_currentRightThighAngle > maxThighAngle){
      this.thighAnimAngle = this.thighAnimAngle * -1;
      //console.log("we are over the limit");
    }

    // calf
    robot.rotateLeftCalf(this.calfAnimAngle);
    robot.rotateRightCalf(-this.calfAnimAngle);
    if (this.x_currentLeftCalfAngle < -0.5 || this.x_currentLeftCalfAngle > 0){
      this.calfAnimAngle = this.calfAnimAngle * -1;
    }

    // arm
    robot.rotateLeftArm(this.armAnimAngle, "x");
    robot.rotateRightArm(-this.armAnimAngle, "x");
    if (this.x_currentLeftArmAngle < -maxArmAngle || this.x_currentLeftArmAngle > maxArmAngle){
      this.armAnimAngle = this.armAnimAngle * -1;
    }

    // up and down movement of the robot
    
    
  }

  checkAnchorPoint(){
    // the lowest point of the robot must be touching the floor at all times
    /* 
      for the same part if the left is lower than the right then we take the lowest offset
      because that will be the part closest to the ground
     */
    let thighLength = 4 * this.thighRadius;
    let calfLength = 4 * this.calfRadius;

    // thighs
    // left thigh
    var offsetLeftThigh = thighLength - thighLength * Math.cos(this.x_currentLeftThighAngle);
    // right thigh
    var offsetRightThigh = thighLength - thighLength * Math.cos(this.x_currentRightThighAngle);

    // find real offset and offset the whole robot
    var realThighOffset = Math.max(offsetRightThigh, offsetLeftThigh);
    this.torsoMatrix = translateMat(this.torsoMatrix, 0, -realThighOffset, 0);

    // undo the previous translation so you can make a new one 


  }

  look_at(point) {
    var localHeadPos = new THREE.Vector3(0, 0, 0);
    var headPos = new THREE.Vector3();

   //Get world location head 
    var matrix = new THREE.Matrix4();
    matrix.multiplyMatrices(this.headMatrix, this.headInitialMatrix);
    matrix.multiplyMatrices(this.torsoMatrix, matrix);
    matrix.multiplyMatrices(this.torsoInitialMatrix, matrix);
    localHeadPos.applyMatrix4(matrix);
    headPos.set(localHeadPos.x, localHeadPos.y, localHeadPos.z);

    // Compute the direction vector ,project on the XZ plane and normalize walk direction
    var targetDirection = new THREE.Vector3();
    targetDirection.subVectors(point, headPos).normalize();
    var projectedTargetDirection = new THREE.Vector3(targetDirection.x, 0, targetDirection.z).normalize();
    var currentWalkDirection = new THREE.Vector3(this.walkDirection.x, 0, this.walkDirection.z).normalize();

    // Calculate the yaw diff (rotation around Y-axis)
    var targetYaw = Math.atan2(projectedTargetDirection.x, projectedTargetDirection.z);
    var currentYaw = Math.atan2(currentWalkDirection.x, currentWalkDirection.z);
    var yawDifference = targetYaw - currentYaw;

    // Calculate horizontal distance and height difference for pitch
    var horizontalDistance = Math.sqrt(
        (point.x - headPos.x) ** 2 + 
        (point.z - headPos.z) ** 2
    );
    
    var heightDifference = point.y - headPos.y;

    // Calculate the target pitch (rotation around X-axis)
    var targetPitch = Math.atan2(heightDifference, horizontalDistance);  // Use atan2 for pitch calculation
    var currentPitch = this.x_currentHeadRotation;  // Get the current pitch (around X-axis)

    // Calculate the pitch difference for head rotation
    var pitchDifference = -targetPitch - currentPitch; // Adjusted to find the correct difference
    var isreseted = false;

    //EXTRA FEATURE: robot can look at itself using 2 axis of rotation
    // When looking at itself,it is not supposed to look behind himself locked out like a human 
    // Sometimes it will break him but if you look on the ground and at him again it will be reseted proprely
    if (point.y > 0.1) { 
        this.rotateHead(-this.y_currentHeadRotation, "y"); // Reset yaw 
        // Calculate the Y-axis (yaw) angle here to allow the head to look at itself
        var targetYaw2 = Math.atan2(headPos.x - point.x, point.y - headPos.y);
        var currentYaw2 = this.y_currentHeadRotation; 

        var yawDifference2 = targetYaw2 - currentYaw2;

        // Apply rotations
        this.rotateHead(pitchDifference, "x"); 
        this.rotateHead(yawDifference2, "y");
        isreseted =true;
    } else {//when lookin at the ground 
         if (isreseted == true) {
          //only reset the head pitch once per switch to reset
          this.rotateHead(-this.x_currentHeadRotation, "x"); 
          isreseted = false;
         }
        this.rotateHead(-this.y_currentHeadRotation, "y"); // Reset yaw
        
        // Rotations f
        this.rotateTorso(yawDifference);
        this.rotateHead(pitchDifference, "x"); 
    }
}
  clampAngle(angle) {
    // Ensure the angle is between -π and π
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  "LeftArm",
  "LeftForearm",
  "RightArm",
  "RightForearm",
  "LeftThigh",
  "LeftCalf",
  "RightThigh",
  "RightCalf"

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
        robot.moveTorso(0.05);
        robot.forwardWalkAnimation();
        break;
      case "Head":
        robot.rotateHead(0.1, "x");
        break;
      case "LeftArm":
        robot.rotateLeftArm(-0.1, "x");
        break;
      case "LeftForearm":
        robot.rotateLeftFarm(-0.1);
        break;
      case "RightArm":
        robot.rotateRightArm(-0.1, "x");
        break;
      case "RightForearm":
        robot.rotateRightFarm(-0.1);
        break;
      case "LeftThigh":
        robot.rotateLeftThigh(-0.1);
        break;
      case "LeftCalf":
        robot.rotateLeftCalf(-0.1);
        break;
      case "RightThigh":
        robot.rotateRightThigh(-0.1);
        break;
      case "RightCalf":
        robot.rotateRightCalf(-0.1);
        break;
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1, "x");
        break;
      case "LeftArm":
        robot.rotateLeftArm(0.1, "x")
        break;
      case "LeftForearm":
        robot.rotateLeftFarm(0.1);
        break;
      case "RightArm":
        robot.rotateRightArm(0.1, "x");
        break;
      case "RightForearm":
        robot.rotateRightFarm(0.1);
        break;
      case "LeftThigh":
        robot.rotateLeftThigh(0.1);
        break;
      case "LeftCalf":
        robot.rotateLeftCalf(0.1);
        break;
      case  "RightThigh":
        robot.rotateRightThigh(0.1);
        break;
      case "RightCalf":
        robot.rotateRightCalf(0.1);
        break;
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1, "y");
        break;
      case "LeftArm":
        robot.rotateLeftArm(-0.1, "z");
        break;
      case "RightArm":
        robot.rotateRightArm(0.1, "z");
        break;
      
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1, "y");
        break;
      case "LeftArm":
        robot.rotateLeftArm(0.1, "z");
        break;
      case "RightArm":
        robot.rotateRightArm(-0.1, "z");
        break;
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
