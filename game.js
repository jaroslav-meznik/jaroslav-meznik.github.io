const gameFile = await fetch("/gameData.json");
const gameData = await gameFile.json();


class Renderer {
	constructor(canvasQuerySelector, contentQuerySelector) {
		this.canvas = document.querySelector(canvasQuerySelector);
		this.content = document.querySelector(contentQuerySelector);

		this.ctx = canvas.getContext("2d");

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.w = canvas.width;
		this.h = canvas.height;
	}

	drawImage(image, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.drawImage(image, x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);
	}

	drawRect(style, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.save();

		this.ctx.fillStyle = style;
		this.ctx.fillRect(x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);

		this.ctx.restore();
	}

	drawText(text, x, y, w, h, ax = 0, ay = 0) {
		let paragraph = document.createElement("p");

		/* Intentionally insecure to allow text styling (I"m lazy and this is the easiest option) */
		paragraph.innerHTML = text;

		paragraph.style.position = "absolute";
		paragraph.style.left = `${x * this.w}px`;
		paragraph.style.top = `${y * this.h}px`;
		paragraph.style.width = `${w * this.w}px`;
		paragraph.style.height = `${h * this.h}px`;
		paragraph.style.transform = `translate(-${ax * 100}%, -${ay * 100}%)`;

		this.content.append(paragraph);
	}

	drawButton(text, callback, ax, ay) {
		let button = document.createElement("button");

		button.textContent = text;
		button.onclick = callback;

		button.style.position = "absolute";
		button.style.left = `${ax * this.w}px`;
		button.style.top = `${ay * this.h}px`;
		button.style.transform = `translate(-50%, -50%)`;

		this.content.append(button);
	}

	clear() {
		this.ctx.clearRect(0, 0, this.w, this.h);
		this.content.replaceChildren();
	}

}

/* Javascript doesn't have static variables so this needs to be global */
const imgCache = new Map();

async function getImage(url, allow_cached = true) {
	if (allow_cached && imgCache.has(url)) {
		return imgCache.get(url);
	}

	let img = new Image();
	img.src = url;

	let result = await new Promise((resolve, reject) => {
		img.onload = () => {
			imgCache.set(url, img);
			resolve(img);
		};
		img.onerror = (err) => {
			reject(err);
		}
	});

	return result
}

const renderer = new Renderer("#canvas", "#content");
/*
let bg = await getImage("/backgrounds/bedroom.jpg");
renderer.drawImage(bg, 0, 0, 1, 1);
renderer.drawRect("black", 0, 0.8, 1, 0.2);
renderer.drawText("You like kissing boys, don't you?", 0.25, 0.85, 0.50, 0.10);
renderer.drawButton("next", () => { renderer.clear(); }, 0.80, 0.85, 0.10, 0.05);
*/

// Start the game
handleScene(gameData[0]["id"]);

// Preload images and cache them,
// a quick hack to improve performance
//prefetchImgs();

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

async function startScene(scene) {
	renderer.clear();

	let bg = await getImage("/thumbnail.png");
	renderer.drawImage(bg, 0, 0, 1, 1);

	renderer.drawText(scene["title"], 0.50, 0.50, 0.20, 0.20);

	renderer.drawButton("Hrát", () => { handleScene(scene["next"]) }, 0.5, 0.7);

	renderer.drawRect("black", 0.5, 0.5, 0.2, 0.2, 0.5, 0.5);
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
