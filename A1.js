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
    this.thighRadius = 0.25;
    this.calfRadius = 0.18;

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  // initialize matrices for parts (WORLD SPACE IT SEEMS)
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
    initialLeftCalfMatrix = translateMat(initialLeftCalfMatrix, -this.torsoRadius/2, -(this.torsoRadius/2 + this.thighRadius + this.calfRadius * 2.4), 0);
    initialLeftCalfMatrix = rescaleMat(initialLeftCalfMatrix, 1, 2, 1);
    return initialLeftCalfMatrix;
  }

  initialRightCalfMatrix(){
    var initialRightCalfMatrix = idMat4();
    initialRightCalfMatrix = translateMat(initialRightCalfMatrix, this.torsoRadius/2, -(this.torsoRadius/2 + this.thighRadius + this.calfRadius * 2.4), 0);
    initialRightCalfMatrix = rescaleMat(initialRightCalfMatrix, 1, 2, 1);
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

  // This function will rotate arms over two axes
  rotateArms(angle, axis){
    // forearm max angle is -2PI/3
    // arm max angle inf x axis / pi/2 z axis
    var leftArmMatrix = this.leftArmMatrix;
    //var leftFarmMatrix = this.leftFarmMatrix;

    this.leftArmMatrix = idMat4();

    this.leftArmMatrix = translateMat(this.leftArmMatrix, 0, -this.torsoHeight/2, 0);
    //this.leftFarmMatrix = translateMat(this.leftFarmMatrix, 0, -this.torsoHeight/2, 0);

    this.leftArmMatrix = rotateMat(this.leftArmMatrix, angle, axis);
    //this.leftFarmMatrix = rotateMat(this.leftFarmMatrix, angle, axis);

    this.leftArmMatrix = translateMat(this.leftArmMatrix, 0, this.torsoHeight/2, 0); 
    //this.leftFarmMatrix = translateMat(this.leftFarmMatrix, 0, this.torsoHeight/2, 0);

    this.leftArmMatrix = multMat(leftArmMatrix, this.leftArmMatrix);
    //this.leftFarmMatrix = multMat(leftFarmMatrix, this.leftFarmMatrix);

    var matrix = multMat(this.leftArmMatrix, this.leftArmInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.leftArm.setMatrix(matrix);

    //var matrix2 = multMat(this.leftFarmMatrix, this.leftFarmInitialMatrix);
    //matrix2 = multMat(this.torsoMatrix, matrix2);
    //matrix2 = multMat(this.torsoInitialMatrix, matrix2);
    //this.leftFarm.setMatrix(matrix);
  }

  rotateFarm(angle){
    
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
<<<<<<< HEAD
  "Arms",
  "Forearms",
  "Thighs",
  "Calves"
  
=======
  "LeftArm"
>>>>>>> 87a479b38af743aee87484f1ca4c512e2bd7d532
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
      // finish these later when arm rotation function is complete
<<<<<<< HEAD
      case "Arms":

        break
      case "Forearms":
        break
      case "Thighs":
        break
      case "Calves":
        break

=======
      case "LeftArm":
        robot.rotateArms(0.1, "x");
        break;
      case "Forearms":
        break;
>>>>>>> 87a479b38af743aee87484f1ca4c512e2bd7d532
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
<<<<<<< HEAD
      case "Arms":
        break
      case "Forearms":
        break
      case "Thighs":
        break
      case "Calves":
        break
=======
      case "LeftArm":
        robot.rotateArms(-0.1, "x")
        break;
      // Add more cases
      // TODO
>>>>>>> 87a479b38af743aee87484f1ca4c512e2bd7d532
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
