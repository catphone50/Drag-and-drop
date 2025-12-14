const tools = document.querySelectorAll(".tool");
const playground = document.querySelector(".playground");
const properties = document.querySelector("#properties");

let selectedElement = null;
let counter = 0;

const handleDragStart = (e) => {
  e.dataTransfer.setData("type", e.currentTarget.dataset.type);
};

const handleDragDrop = (e) => {
  e.preventDefault();

  const type = e.dataTransfer.getData("type");
  const rect = playground.getBoundingClientRect(); // get size and position

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  createElement(type, x, y);
};

playground.addEventListener("dragover", (e) => {
  e.preventDefault();
});

tools.forEach((tool) => {
  tool.addEventListener("dragstart", handleDragStart);
});

playground.addEventListener("drop", handleDragDrop);

const createElement = (type, x, y) => {
  counter++;

  const wrapper = document.createElement("div");
  wrapper.className = "playground-item";
  wrapper.dataset.type = type;
  wrapper.style.left = x + "px";
  wrapper.style.top = y + "px";
  wrapper.style.width = "100px";
  wrapper.style.height = "100px";

  let content = null;

  if (type === "text") {
    content = document.createElement("p");
    content.className = "text-content";
    content.innerText = `Text ${counter}`;
  }

  if (type === "image") {
    content = document.createElement("img");
    content.draggable = false;
    const width = 100;
    const height = 100;
    content.src = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
  }

  if (type === "shape") {
    content = document.createElementNS("http://www.w3.org/2000/svg", "svg"); // create svg not html
    content.setAttribute("width", "100");
    content.setAttribute("height", "100");
    content.setAttribute("viewBox", "0 0 100 100");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M10 10 H90 V90 H10 Z");
    path.setAttribute("fill", "#000000");

    content.appendChild(path);
  }
  console.log(content);

  wrapper.appendChild(content);

  playground.appendChild(wrapper);

  makeDraggable(wrapper);

  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    selectElement(wrapper);
  });

  return wrapper;
};

const makeDraggable = (element) => {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  element.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    selectElement(element);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const rect = playground.getBoundingClientRect();

    let left = e.clientX - rect.left - offsetX;
    let top = e.clientY - rect.top - offsetY;

    left = Math.max(
      0,
      Math.min(left, playground.clientWidth - element.offsetWidth)
    );
    top = Math.max(
      0,
      Math.min(top, playground.clientHeight - element.offsetHeight)
    );

    element.style.left = left + "px";
    element.style.top = top + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
};

const selectElement = (element) => {
  clearSelection();
  element.classList.add("selected");
  selectedElement = element;
  showProperties(element);
};

const clearSelection = () => {
  document
    .querySelectorAll(".playground-item")
    .forEach((item) => item.classList.remove("selected"));
};

document.addEventListener("click", (element) => {
  const isInsideProperties = document
    .querySelector(".properties")
    .contains(element.target);

  if (isInsideProperties) return;
  clearSelection();
  properties.textContent = "Select an element";
  selectedElement = null;
});

const buildText = (element) => {
  const wrapper = element;
  const textEl = wrapper.querySelector(".text-content");
  if (!textEl) return;
  const styles = window.getComputedStyle(textEl);
  return `
      <div class="prop-group">
        <label>Text</label>
        <input type="text"
               data-prop="text"
               value="${textEl.textContent}">
      </div>

<div class="prop-group">
        <label>Font size (px)</label>
        <input type="number"
               data-prop="fontSize"
               value="${parseInt(styles.fontSize, 10)}">
      </div>

      <div class="prop-group">
        <label>Font family</label>
        <select data-prop="fontFamily">
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div class="prop-group">
  <label>Style</label>
  <div class="text-style">
    <label>
      <input type="checkbox" data-prop="bold"> Bold
    </label>

    <label>
      <input type="checkbox" data-prop="italic"> Italic
    </label>

    <label>
      <input type="checkbox" data-prop="underline"> Underline
    </label>
  </div>
</div>
    `;
};

const buildImage = (element) => {
  const img = element.querySelector("img");
  if (!img) return "";

  return `
    <div class="prop-group">
      <label>Image source</label>
      <input
        type="text"
        data-prop="src"
        value="${img.src}"

      />
    </div>
  `;
};

const buildShape = (element) => {
  const path = element.querySelector("path");
  if (!path) return "";

  return `
    <div class="prop-group">
      <label>SVG path (d)</label>
      <textarea
        data-prop="path"
        rows="4"
      >${path.getAttribute("d")}</textarea>
    </div>

   <div class="prop-group">
      <label>Fill</label>
      <input type="color" data-prop="fill" value="${
        path.getAttribute("fill") || "#000000"
      }">
    </div>
  `;
};

const showProperties = (element) => {
  const type = element.dataset.type;

  let html = `
     <div class="prop-group">
      <label>Width</label>
      <input type="number" data-prop="width" value="${element.offsetWidth}">
    </div>

    <div class="prop-group">
      <label>Height</label>
      <input type="number" data-prop="height" value="${element.offsetHeight}">
    </div>
   `;

  if (type === "text") {
    const textProps = buildText(element);
    if (textProps) html += textProps;
  }

  if (type === "image") {
    html += buildImage(element);
  }

  html += `
  <div class="prop-group danger">
    <button id="deleteElement">Delete element</button>
  </div>
`;
  if (type === "shape") {
    html += buildShape(element);
  }

  properties.innerHTML = html;

  if (type === "text") {
    const textEl = element.querySelector(".text-content");
    const styles = window.getComputedStyle(textEl);
    const select = properties.querySelector('[data-prop="fontFamily"]');
    select.value = styles.fontFamily.replace(/["']/g, "");
  }

  properties.addEventListener("click", (e) => {
    if (e.target.id !== "deleteElement") return;
    if (!selectedElement) return;

    selectedElement.remove();
    selectedElement = null;
    properties.textContent = "Select an element";
  });
};

const resizeContent = (wrapper) => {
  const width = wrapper.offsetWidth;
  const height = wrapper.offsetHeight;

  const type = wrapper.dataset.type;

  if (type === "image") {
    const img = wrapper.querySelector("img");
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
  }

  if (type === "shape") {
    const svg = wrapper.querySelector("svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    const svgRect = svg.querySelector("path");
    svgRect.setAttribute("width", width);
    svgRect.setAttribute("height", height);
  }

  if (type === "text") {
    const text = wrapper.querySelector(".text-content");
    text.style.width = "100%";
    text.style.height = "100%";
  }
};

properties.addEventListener("input", (e) => {
  if (!selectedElement) return;

  const prop = e.target.dataset.prop;
  if (!prop) return;

  if (prop === "width") {
    selectedElement.style.width = e.target.value + "px";
    resizeContent(selectedElement);
  }

  if (prop === "height") {
    selectedElement.style.height = e.target.value + "px";
    resizeContent(selectedElement);
  }

  if (selectedElement.dataset.type === "text") {
    const textEl = selectedElement.querySelector(".text-content");

    if (prop === "text") {
      textEl.textContent = e.target.value;
    }

    if (prop === "fontSize") {
      textEl.style.fontSize = e.target.value + "px";
    }

    if (prop === "fontFamily") {
      textEl.style.fontFamily = e.target.value;
    }
    if (prop === "bold") {
      textEl.style.fontWeight = e.target.checked ? "bold" : "normal";
    }

    if (prop === "italic") {
      textEl.style.fontStyle = e.target.checked ? "italic" : "normal";
    }

    if (prop === "underline") {
      textEl.style.textDecoration = e.target.checked ? "underline" : "none";
    }
  }

  if (selectedElement.dataset.type === "image" && prop === "src") {
    const img = selectedElement.querySelector("img");
    if (img) img.src = e.target.value;
  }

  if (selectedElement.dataset.type === "shape") {
    const path = selectedElement.querySelector("path");
    if (!path) return;

    if (prop === "path") {
      try {
        path.setAttribute("d", e.target.value);
      } catch (e) {
        console.warn("Invalid SVG path");
      }
    }

    if (prop === "fill") {
      path.setAttribute("fill", e.target.value);
    }
  }
});

const getState = () => {
  const items = document.querySelectorAll(".playground-item");

  return {
    elements: Array.from(items).map((item) => {
      const type = item.dataset.type;

      const base = {
        type,
        x: parseInt(item.style.left),
        y: parseInt(item.style.top),
        width: item.offsetWidth,
        height: item.offsetHeight,
        props: {},
      };

      if (type === "text") {
        const text = item.querySelector(".text-content");
        base.props = {
          text: text.textContent,
          fontSize: text.style.fontSize,
          fontFamily: text.style.fontFamily,
          fontWeight: text.style.fontWeight,
          fontStyle: text.style.fontStyle,
          textDecoration: text.style.textDecoration,
        };
      }

      if (type === "image") {
        base.props = {
          src: item.querySelector("img").src,
        };
      }

      if (type === "shape") {
        const path = item.querySelector("path");
        base.props = {
          path: path.getAttribute("d"),
          fill: path.getAttribute("fill"),
        };
      }

      return base;
    }),
  };
};

const saveState = () => {
  const state = getState();
  localStorage.setItem("playgroundState", JSON.stringify(state));
};

document.getElementById("save").addEventListener("click", saveState);

const loadState = () => {
  const raw = localStorage.getItem("playgroundState");
  if (!raw) return;

  const state = JSON.parse(raw);
  playground.innerHTML = "";

  state.elements.forEach((el) => {
    const wrapper = createElement(el.type, el.x, el.y);
    wrapper.style.width = el.width + "px";
    wrapper.style.height = el.height + "px";

    if (el.type === "text") {
      const text = wrapper.querySelector(".text-content");
      Object.assign(text.style, {
        fontSize: el.props.fontSize,
        fontFamily: el.props.fontFamily,
        fontWeight: el.props.fontWeight,
        fontStyle: el.props.fontStyle,
        textDecoration: el.props.textDecoration,
      });
      text.textContent = el.props.text;
    }

    if (el.type === "image") {
      wrapper.querySelector("img").src = el.props.src;
    }

    if (el.type === "shape") {
      const path = wrapper.querySelector("path");
      path.setAttribute("d", el.props.path);
      path.setAttribute("fill", el.props.fill);
    }

    resizeContent(wrapper);
  });
};

const loadBtn = document.getElementById("load");

loadBtn.addEventListener("click", () => {
  loadState();
});

const updateLoadButton = () => {
  loadBtn.disabled = !localStorage.getItem("playgroundState");
};

updateLoadButton();
