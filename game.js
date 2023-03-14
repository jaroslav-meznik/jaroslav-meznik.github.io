const res = await fetch("/gameData.json");

const gameData = await res.json();

// Start the game
handleScene(gameData[0]["id"]);

// Preload images and cache them,
// an ugly hack to improve performance
prefetchImgs();

function handleScene(sceneId) {
  let scene = getSceneById(sceneId);

  switch (scene["type"]) {
    case "startScene":
      startScene(scene);
      break;
    case "dialogScene":
      dialogScene(scene);
      break;
    case "speechScene":
      speechScene(scene);
      break;
    case "choiceScene":
      choiceScene(scene);
      break;
    case "documentScene":
      documentScene(scene);
      break;
    case "infoScene":
      infoScene(scene);
      break;
    case "endScene":
      endScene(scene);
      break;

    default:
      console.log(`Unknown scene type: ${scene["type"]}`);
      break;
  }
}

function startScene(scene) {
  let sceneElement = document.querySelector("#start-scene");

  sceneElement.style.display = "block";

  let titleElement = sceneElement.querySelector("#start-title");
  titleElement.textContent = scene["title"];

  let startBtn = sceneElement.querySelector("#start-btn");
  startBtn.onclick = (e) => {
    e.preventDefault();
    handleScene(scene["next"]);
  };

  displayScene(sceneElement);
}

function dialogScene(scene) {
  let bgElement = document.querySelector("#dialog-bg");
  bgElement.src = scene["bg"];

  displayScene(document.querySelector("#dialog-scene"));

  handleScene(scene["next"]);
}

function speechScene(scene) {
  let sceneElement = document.querySelector("#speech-scene");

  let personElement = sceneElement.querySelector("#speech-person");
  personElement.src = scene["person"];

  let nameElement = sceneElement.querySelector("#speech-name");
  nameElement.textContent = scene["name"] + ":";

  let textElement = sceneElement.querySelector("#speech-text");
  textElement.textContent = scene["text"];

  let nextBtn = sceneElement.querySelector("#speech-btn");
  nextBtn.onclick = (e) => {
    e.preventDefault();
    handleScene(scene["next"]);
  };

  displayContent(sceneElement);
}

function choiceScene(scene) {
  let sceneElement = document.querySelector("#choice-scene");

  let personElement = sceneElement.querySelector("#choice-person");
  personElement.src = scene["person"];

  let questionElement = sceneElement.querySelector("#choice-question");
  questionElement.textContent = scene["question"];

  scene["choices"].forEach((choice, index) => {
    let choiceElement = sceneElement.querySelector(
      `#choice-option-${index + 1}`
    );

    choiceElement.querySelector("p").textContent = choice["text"];

    choiceElement.onclick = (e) => {
      e.preventDefault();
      handleScene(choice["next"]);
    };
  });

  displayContent(sceneElement);
}

function documentScene(scene) {
  let sceneElement = document.querySelector("#document-scene");

  let docElement = sceneElement.querySelector("#document-doc");
  docElement.innerHTML = scene["document"];

  let nextBtn = sceneElement.querySelector("#document-btn");
  nextBtn.onclick = (e) => {
    e.preventDefault();
    handleScene(scene["next"]);
  };

  displayContent(sceneElement);
}

function infoScene(scene) {
  let sceneElement = document.querySelector("#info-scene");

  let imageElement = sceneElement.querySelector("#info-img");
  imageElement.src = scene["image"];

  let textElement = sceneElement.querySelector("#info-text");
  textElement.textContent = scene["text"];

  let nextBtn = sceneElement.querySelector("#info-btn");
  nextBtn.onclick = (e) => {
    e.preventDefault();
    handleScene(scene["next"]);
  };

  displayScene(sceneElement);
}

function endScene(scene) {
  let sceneElement = document.querySelector("#end-scene");

  let titleElement = sceneElement.querySelector("#end-title");
  titleElement.textContent = scene["title"];

  let endingElement = sceneElement.querySelector("#end-ending");
  endingElement.textContent = scene["ending"];

  displayScene(sceneElement);
}

function getSceneById(id) {
  let scene = gameData.find((scene) => scene["id"] == id);

  if (scene !== null) {
    return scene;
  } else {
    return gameData[0];
  }
}

function displayScene(sceneElement) {
  for (let sceneEl of document.querySelectorAll(".scene")) {
    sceneEl.style.display = "none";
    sceneEl.classList.remove("fade-in");
  }
  sceneElement.style.display = "block";
  sceneElement.classList.add("fade-in");
}

function displayContent(contentElement) {
  for (let contentEl of document.querySelectorAll(".content")) {
    contentEl.style.display = "none";
  }
  contentElement.style.display = "block";
}

async function prefetchImgs() {
  let images = [
    "/backgrounds/bedroom.jpg",
    "/backgrounds/classroom.jpg",
    "/backgrounds/kitchen.jpg",
    "/backgrounds/office.jpg",
    "/backgrounds/office_2.jpg",
    "/backgrounds/outside.jpg",
    "/backgrounds/outside_boxes.jpg",
    "/people/boyfriend-angry.png",
    "/people/boyfriend-happy.png",
    "/people/boyfriend-idle.png",
    "/people/daughter-angry.png",
    "/people/daughter-happy.png",
    "/people/daughter-idle.png",
    "/people/guy.png",
    "/people/mckun-angry.png",
    "/people/mckun-idle.png",
    "/people/mckun-thinking.png",
    "/people/person.png",
  ];

  for (let url of images) {
    let image = new Image();
    image.src = url;
    await new Promise((resolve) => {
      image.onload = () => {
        resolve();
      };
    });
  }
}
