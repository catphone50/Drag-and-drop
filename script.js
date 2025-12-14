const $tools = $(".tool");
const $playground = $(".playground");
const $properties = $("#properties");

let selectedElement = null;
let counter = 0;
let dragState = {
  dragging: false,
  $el: null,
  offsetX: 0,
  offsetY: 0,
};

$tools.on("dragstart", function (e) {
  e.originalEvent.dataTransfer.setData("type", $(this).data("type"));
});

const handleDragDrop = function (e) {
  e.preventDefault();

  const type = e.originalEvent.dataTransfer.getData("type");
  const rect = this.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  createElement(type, x, y);
};

$playground.on("dragover", function (e) {
  e.preventDefault();
});
$playground.on("drop", handleDragDrop);

const createElement = (type, x, y) => {
  counter++;

  const $wrapper = $("<div>")
    .addClass("playground-item")
    .data("type", type)
    .css({
      left: x,
      top: y,
      width: 100,
      height: 100,
      position: "absolute",
    });

  let $content;

  if (type === "text") {
    $content = $("<p>").addClass("text-content").text(`Text ${counter}`);
  }

  if (type === "image") {
    $content = $("<img>", {
      draggable: false,
      src: `https://picsum.photos/100/100?random=${Math.random()}`,
    });
  }

  if (type === "shape") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    $(svg).attr({
      width: 100,
      height: 100,
      viewBox: "0 0 100 100",
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    $(path).attr({
      d: "M10 10 H90 V90 H10 Z",
      fill: "#000000",
    });

    svg.appendChild(path);
    $content = $(svg);
  }

  $wrapper.append($content);
  $playground.append($wrapper);

  makeDraggable($wrapper);

  $wrapper.on("click", function (e) {
    e.stopPropagation();
    selectElement(this);
  });

  return $wrapper;
};

const makeDraggable = ($el) => {
  $el.on("mousedown", function (e) {
    dragState.dragging = true;
    dragState.$el = $el;
    dragState.offsetX = e.offsetX;
    dragState.offsetY = e.offsetY;

    selectElement(this);
  });
};

$(document).on("mousemove", function (e) {
  if (!dragState.dragging || !dragState.$el) return;

  const rect = $playground[0].getBoundingClientRect();

  let left = e.clientX - rect.left - dragState.offsetX;
  let top = e.clientY - rect.top - dragState.offsetY;

  left = Math.max(
    0,
    Math.min(left, $playground.width() - dragState.$el.outerWidth())
  );

  top = Math.max(
    0,
    Math.min(top, $playground.height() - dragState.$el.outerHeight())
  );

  dragState.$el.css({ left, top });
});

$(document).on("mouseup", function () {
  dragState.dragging = false;
  dragState.$el = null;
});

const selectElement = (el) => {
  clearSelection();
  $(el).addClass("selected");
  selectedElement = el;
  showProperties(el);
};

const clearSelection = () => {
  $(".playground-item").removeClass("selected");
};

$(document).on("click", function (e) {
  if ($(e.target).closest(".properties").length) return;

  clearSelection();
  $properties.text("Select an element");
  selectedElement = null;
});

const buildText = (el) => {
  const $text = $(el).find(".text-content");
  const styles = window.getComputedStyle($text[0]);
  const currentFont = styles.fontFamily.replace(/['"]/g, "");

  const option = (name) =>
    `<option ${currentFont.includes(name) ? "selected" : ""}>${name}</option>`;

  return `
    <div class="prop-group">
      <label>Text</label>
      <input type="text" data-prop="text" value="${$text.text()}">
    </div>

    <div class="prop-group">
      <label>Font size</label>
      <input type="number" data-prop="fontSize" value="${parseInt(
        styles.fontSize
      )}">
    </div>

    <div class="prop-group">
      <label>Font family</label>
      <select data-prop="fontFamily">
        ${option("Arial")}
        ${option("Times New Roman")}
        ${option("Courier New")}
      </select>
    </div>

    <div class="prop-group">
      <label><input type="checkbox" data-prop="bold" ${
        styles.fontWeight === "700" || styles.fontWeight === "bold"
          ? "checked"
          : ""
      }> Bold</label>

      <label><input type="checkbox" data-prop="italic" ${
        styles.fontStyle === "italic" ? "checked" : ""
      }> Italic</label>

      <label><input type="checkbox" data-prop="underline" ${
        styles.textDecoration.includes("underline") ? "checked" : ""
      }> Underline</label>
    </div>
  `;
};

const buildImage = (el) => {
  return `
    <div class="prop-group">
      <label>Image src</label>
      <input type="text" data-prop="src" value="${$(el)
        .find("img")
        .attr("src")}">
    </div>
  `;
};

const buildShape = (el) => {
  const $path = $(el).find("path");

  return `
    <div class="prop-group">
      <label>SVG path</label>
      <textarea data-prop="path">${$path.attr("d")}</textarea>
    </div>

    <div class="prop-group">
      <label>Fill</label>
      <input type="color" data-prop="fill" value="${$path.attr("fill")}">
    </div>
  `;
};

const showProperties = (el) => {
  const type = $(el).data("type");

  let html = `
    <div class="prop-group">
      <label>Width</label>
      <input type="number" data-prop="width" value="${$(el).outerWidth()}">
    </div>

    <div class="prop-group">
      <label>Height</label>
      <input type="number" data-prop="height" value="${$(el).outerHeight()}">
    </div>
  `;

  if (type === "text") html += buildText(el);
  if (type === "image") html += buildImage(el);
  if (type === "shape") html += buildShape(el);

  html += `
    <div class="prop-group danger">
      <button id="deleteElement">Delete element</button>
    </div>
  `;

  $properties.html(html);
};

$properties.on("input", "[data-prop]", function () {
  if (!selectedElement) return;

  const prop = $(this).data("prop");
  const $el = $(selectedElement);
  const type = $el.data("type");

  if (prop === "width") $el.css("width", $(this).val());
  if (prop === "height") $el.css("height", $(this).val());

  if (type === "text") {
    const $text = $el.find(".text-content");

    if (prop === "text") $text.text($(this).val());
    if (prop === "fontSize") $text.css("font-size", $(this).val() + "px");
    if (prop === "fontFamily") $text.css("font-family", $(this).val());
    if (prop === "bold")
      $text.css("font-weight", this.checked ? "bold" : "normal");
    if (prop === "italic")
      $text.css("font-style", this.checked ? "italic" : "normal");
    if (prop === "underline")
      $text.css("text-decoration", this.checked ? "underline" : "none");
  }

  if (type === "image" && prop === "src") {
    $el.find("img").attr("src", $(this).val());
  }

  if (type === "shape") {
    const $path = $el.find("path");

    if (prop === "path") $path.attr("d", $(this).val());
    if (prop === "fill") $path.attr("fill", $(this).val());
  }
});

$properties.on("click", "#deleteElement", function () {
  if (!selectedElement) return;

  $(selectedElement).remove();
  selectedElement = null;
  $properties.text("Select an element");
});

const getState = () => ({
  elements: $(".playground-item")
    .toArray()
    .map((el) => {
      const $el = $(el);
      const type = $el.data("type");

      const base = {
        type,
        x: parseInt($el.css("left")),
        y: parseInt($el.css("top")),
        width: $el.outerWidth(),
        height: $el.outerHeight(),
        props: {},
      };

      if (type === "text") {
        const $t = $el.find(".text-content");
        base.props = {
          text: $t.text(),
          fontSize: $t.css("font-size"),
          fontFamily: $t.css("font-family"),
          fontWeight: $t.css("font-weight"),
          fontStyle: $t.css("font-style"),
          textDecoration: $t.css("text-decoration"),
        };
      }

      if (type === "image") {
        base.props.src = $el.find("img").attr("src");
      }

      if (type === "shape") {
        const $p = $el.find("path");
        base.props = {
          path: $p.attr("d"),
          fill: $p.attr("fill"),
        };
      }

      return base;
    }),
});

$("#save").on("click", function () {
  localStorage.setItem("playgroundState", JSON.stringify(getState()));
});

$("#load").on("click", function () {
  const raw = localStorage.getItem("playgroundState");
  if (!raw) return;

  $playground.empty();
  const state = JSON.parse(raw);

  state.elements.forEach((el) => {
    const $w = createElement(el.type, el.x, el.y);
    $w.css({ width: el.width, height: el.height });

    if (el.type === "text") {
      const $t = $w.find(".text-content");
      Object.assign($t[0].style, el.props);
      $t.text(el.props.text);
    }

    if (el.type === "image") {
      $w.find("img").attr("src", el.props.src);
    }

    if (el.type === "shape") {
      const $p = $w.find("path");
      $p.attr(el.props);
    }
  });

  counter = state.elements.length;
});
