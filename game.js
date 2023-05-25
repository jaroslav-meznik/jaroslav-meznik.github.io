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

		this.bg = null;
	}

	drawImage(image, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.drawImage(image, x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);
	}

	drawImageRatio(image, x, y, w_max, h_max, ax = 0, ay = 0) {
		let ratio = image.width / image.height;
		let w = 0;
		let h = 0;

		if (w_max / ratio < h_max) {
			w = w_max;
			h = w_max / ratio;
		} else {
			w = h_max * ratio;
			h = h_max;
		}

		this.ctx.drawImage(image, x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);
	}

	drawBG(bg = false) {
		if (bg) {
			this.drawImage(bg, 0, 0, 1, 1);
			this.bg = bg;
		} else if (this.bg) {
			this.drawImage(this.bg, 0, 0, 1, 1);
		}
	}

	drawRect(style, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.save();

		this.ctx.fillStyle = style;
		this.ctx.fillRect(x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);

		this.ctx.restore();
	}

	drawText(text, styles = {}, x, y, w, h, ax = 0, ay = 0) {
		let paragraph = document.createElement("p");

		/* Intentionally insecure to allow text styling (I"m lazy and this is the easiest option) */
		paragraph.innerHTML = text;

		paragraph.style.position = "absolute";
		paragraph.style.left = `${x * this.w}px`;
		paragraph.style.top = `${y * this.h}px`;
		if (w > 0) {
			paragraph.style.width = `${w * this.w}px`;
		}
		if (h > 0) {
			paragraph.style.height = `${h * this.h}px`;
		}
		paragraph.style.transform = `translate(-${ax * 100}%, -${ay * 100}%)`;

		for (const style in styles) {
			paragraph.style[style] = styles[style];
		}

		this.content.append(paragraph);
	}

	drawButton(text, callback, ax, ay, w = 0, h = 0) {
		let button = document.createElement("button");

		button.textContent = text;
		button.onclick = callback;

		button.style.position = "absolute";
		button.style.left = `${ax * this.w}px`;
		button.style.top = `${ay * this.h}px`;
		if (w > 0) {
			button.style.width = `${w * this.w}px`;
		}
		if (h > 0) {
			button.style.height = `${h * this.h}px`;
		}
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
	renderer.drawBG(bg);

	renderer.drawButton("Hrát", () => { handleScene(scene["next"]) }, 0.5, 0.75);
}

async function dialogScene(scene) {
	renderer.clear();

	let bg = await getImage(scene["bg"]);
	renderer.drawBG(bg);

	handleScene(scene["next"]);
}

async function speechScene(scene) {
	renderer.clear();
	renderer.drawBG();

	renderer.drawRect("black", 0, 0.75, 1, 0.25);

	if (scene["person"] !== "") {
		let person = await getImage(scene["person"]);
		renderer.drawImageRatio(person, 0.25, 0.75, 0.3, 0.6, 0.5, 1.0);
	}

	renderer.drawText(`${scene["name"]}:`, {}, 0.25, 0.8, 0.05, 0);
	renderer.drawText(scene["text"], {}, 0.25, 0.85, 0.5, 0.1);

	renderer.drawButton("Pokračovat", () => { handleScene(scene["next"]); }, 0.8, 0.9);
}

async function choiceScene(scene) {
	renderer.clear();
	renderer.drawBG();

	renderer.drawRect("black", 0, 0.75, 1, 0.25);

	if (scene["person"] !== "") {
		let person = await getImage(scene["person"]);
		renderer.drawImageRatio(person, 0.25, 0.75, 0.3, 0.6, 0.5, 1.0);
	}

	scene["choices"].forEach((choice, index) => {
		renderer.drawButton(choice["text"], () => { handleScene(choice["next"]); }, 0.5, 0.8 + index * 0.075, 0.8);
	});
	//let sceneElement = document.querySelector("#choice-scene");
	//let personElement = sceneElement.querySelector("#choice-person");
	//personElement.src = scene["person"];
	//let questionElement = sceneElement.querySelector("#choice-question");
	//questionElement.textContent = scene["question"];
	//scene["choices"].forEach((choice, index) => {
	//	let choiceElement = sceneElement.querySelector(
	//		`#choice-option-${index + 1}`
	//	);
	//	choiceElement.querySelector("p").textContent = choice["text"];
	//	choiceElement.onclick = (e) => {
	//		e.preventDefault();
	//		handleScene(choice["next"]);
	//	};
	//});
	//displayContent(sceneElement);
}

async function documentScene(scene) {
	//let sceneElement = document.querySelector("#document-scene");
	//let docElement = sceneElement.querySelector("#document-doc");
	//docElement.innerHTML = scene["document"];
	//let nextBtn = sceneElement.querySelector("#document-btn");
	//nextBtn.onclick = (e) => {
	//	e.preventDefault();
	//	handleScene(scene["next"]);
	//};
	//displayContent(sceneElement);
}

async function infoScene(scene) {
	renderer.clear();

	renderer.drawRect("black", 0, 0, 1, 1);

	let image = await getImage(scene["image"]);
	renderer.drawImageRatio(image, 0.5, 0.4, 1, 0.6, 0.5, 0.5);

	renderer.drawText(scene["text"], {}, 0.5, 0.75, 0.5, 0, 0.5, 0);

	renderer.drawButton("Pokračovat", () => { handleScene(scene["next"]); }, 0.8, 0.8);
}

async function endScene(scene) {
	//let sceneElement = document.querySelector("#end-scene");
	//let titleElement = sceneElement.querySelector("#end-title");
	//titleElement.textContent = scene["title"];
	//let endingElement = sceneElement.querySelector("#end-ending");
	//endingElement.textContent = scene["ending"];
	//displayScene(sceneElement);
}

function getSceneById(id) {
	let scene = gameData.find((scene) => scene["id"] == id);

	if (scene !== null) {
		return scene;
	} else {
		return gameData[0];
	}
}
