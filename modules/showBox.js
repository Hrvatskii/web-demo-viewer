// **********************************************************************************************
// * Module that creates a generic, moveable box that's used for input display and demo header. *
// **********************************************************************************************

const showBox = (innerHtml, additionalClass, additionalDataset) => {
  // initialize the container and give it a class
  const boxContainer = document.createElement("div");
  boxContainer.className = "box-container";

  // initialize the content and give it its class as well as any additional classes
  const boxContent = document.createElement("div");
  boxContent.className = `box-content ${additionalClass ? additionalClass : ""}`;

  // assign any optional datasets to the content
  if (additionalDataset) boxContent.dataset.value = additionalDataset;

  boxContent.innerHTML = innerHtml;
  document.body.append(boxContainer);
  boxContainer.append(boxContent)

  // intialize the close button
  const closeButton = document.createElement("button");
  closeButton.className = "normal-button close-box";
  closeButton.innerHTML = "&#10005;";
  closeButton.onclick = () => boxContainer.remove();
  boxContent.append(closeButton);

  // everything below handles movement of the box
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  boxContainer.addEventListener("mousedown", (event) => {
    if (event.target.className !== "box-container") return;
    pos3 = event.clientX;
    pos4 = event.clientY;
    document.body.addEventListener("mousemove", movebox);
    document.body.addEventListener("mouseup", () => {
      document.body.removeEventListener("mousemove", movebox);
    })
  })

  function movebox(event) {
    event.preventDefault();
    pos1 = pos3 - event.clientX;
    pos2 = pos4 - event.clientY;
    pos3 = event.clientX;
    pos4 = event.clientY;
    boxContainer.style.top = (boxContainer.offsetTop - pos2) + "px";
    boxContainer.style.left = (boxContainer.offsetLeft - pos1) + "px";
  }

}

export {showBox};