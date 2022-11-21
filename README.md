scene (all scenes inherit automatically):

- id
- type (startScene, dialogScene, speechScene, choiceScene, documentScene, infoScene, endScene)
- next (id of the next scene)

startScene:

- title (text)

dialogScene:

- bg (image url)

speechScene:

- person (image url)
- name (text)
- text (text)

choiceScene:

- person (image url)
- question (text)
- choices (array of 3 choices, each choice is in the form { text (text), next (id of the next scene) } )

documentScene:

- document (html)

infoScene:

- image (url)
- text (text)

endScene:

- title (text)
- ending (description of how the game ended)

scene template:

{
"id": "",
"type": "",
"next": "",
}
