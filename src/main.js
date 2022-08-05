import './style/main.less'

import $ from 'jquery'
import screenfull from 'screenfull'

const longTouchDurationMs = 2000;
const longTouchThreshholdPx = 30;
const mouseButtons = {
  left: 0,
  right: 2
};

let activeMouseDown = null;
let canvas = null;
let editorWrapper = null;
let longTouchTimer = null;
let lastPositions = {};
let startPositions = {};
let storedTouchStartEvent = null;
let longTouchPrimed = null;

function bitCodeMouseButton(button) {
  switch (button) {
    case 0:
      return 1  // Primary (left) mouse button
    case 1:
      return 4  // Auxiliary (middle) mouse button
    case 2:
      return 2  // Secondary (right) mouse button
    case 3:
      return 8  // "Back" button
    case 4:
      return 16 // "Forward" button
    default:
      return 0  // No button pressed
  }
}

function sign(num) {
  if (num < 0) {
    return -1
  } else if (num > 0) {
    return 1
  } else {
    return 0
  }
}

function fakeTouchEvent(originalEvent, touch, mouseButton, recordActiveMouseDown = true) {
  if (originalEvent == null || typeof originalEvent !== 'object') {
    console.warn(`Passed invalid event argument to fakeTouchEvent: ${originalEvent}`)
    return
  }

  const type = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
  }[originalEvent.type]

  const simulatedEvent = new MouseEvent(type, {
    screenX: touch.screenX,
    screenY: touch.screenY,
    clientX: touch.clientX,
    clientY: touch.clientY,
    ctrlKey: originalEvent.ctrlKey || false,
    altKey: originalEvent.altKey || false,
    shiftKey: originalEvent.shiftKey || false,
    metaKey: originalEvent.metaKey || false,
    button: mouseButton,
    buttons: bitCodeMouseButton(mouseButton),
    relatedTarget: originalEvent.relatedTarget || null,
    region: originalEvent.region || null,
    detail: 0,
    view: window,
    sourceCapabilities: originalEvent.sourceCapabilities,
    eventInit: {
      bubbles: true,
      cancelable: true,
      composed: true,
    }
  })
  touch.target.dispatchEvent(simulatedEvent);

  let toolbar = document.getElementById('floatingtoolbar');
  // dirty hack for sticky hover on touch suggested here: 
  //    https://stackoverflow.com/questions/17233804/how-to-prevent-sticky-hover-effects-for-buttons-on-touch-devices
  if (touch.target.id === 'finalcanvas' && toolbar && toolbar.matches(':hover')) {
    const toolbarParent = toolbar.parentNode;
    const next = toolbar.nextSibling;
    toolbarParent.removeChild(toolbar);
    setTimeout(function () { toolbarParent.insertBefore(toolbar, next); }, 0);
  }

  if (recordActiveMouseDown) {
    if (type === 'mousedown') {
      activeMouseDown = {
        screenX: touch.screenX,
        screenY: touch.screenY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target,
      }
    } else if (type === 'mouseup') {
      activeMouseDown = null
    }
  }
}

function startLongTouch() {
  longTouchTimer = setTimeout(function () {
    longTouchPrimed = true;
  }, longTouchDurationMs);
}

function resetLongTouchTimer() {
  clearTimeout(longTouchTimer);
  longTouchTimer = null;
  longTouchPrimed = false;
}

function updatePositions(event) {
  lastPositions = {}
  for (const touch of event.touches) {
    lastPositions[touch.identifier] = {
      x: touch.screenX,
      y: touch.screenY,
    }

    if (startPositions[touch.identifier] == null) {
      startPositions[touch.identifier] = {
        x: touch.screenX,
        y: touch.screenY,
      }
    }
  }
}

function clearTouchBuffer() {
  lastPositions = {};
  startPositions = {};
  resetLongTouchTimer();
}

function actionSingleTouchDrag(event) {
  // Check if we're exceeding the long touch movement threshold. If we are, trigger the stored event.
  const dxStart = event.touches[0].screenX - startPositions[event.touches[0].identifier].x;
  const dyStart = event.touches[0].screenY - startPositions[event.touches[0].identifier].y;
  if (Math.abs(dxStart) > longTouchThreshholdPx || Math.abs(dyStart) > longTouchThreshholdPx) {
    fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.left, true);
    storedTouchStartEvent = null;
    resetLongTouchTimer();
  } else {

  }
}

function actionDoubleTouchPinch(event) {
  const dx1Start = event.touches[0].screenX - startPositions[event.touches[0].identifier].x;
  const dx2Start = event.touches[1].screenX - startPositions[event.touches[1].identifier].x;
  const dy1Start = event.touches[0].screenY - startPositions[event.touches[0].identifier].y;
  const dy2Start = event.touches[1].screenY - startPositions[event.touches[1].identifier].y;

  if (Math.abs(sign(dx1Start) - sign(dx2Start)) === 2 || Math.abs(sign(dy1Start) - sign(dy2Start)) === 2) {
    return true;
  } else {
    return false;
  }
}

function actionDoubleTouchZoom(event) {
  // Fingers move in opposite directions => zoom gesture
  const lastDistX = Math.abs(lastPositions[event.touches[0].identifier].x -
    lastPositions[event.touches[1].identifier].x)
  const lastDistY = Math.abs(lastPositions[event.touches[0].identifier].y -
    lastPositions[event.touches[1].identifier].y)
  const lastDist = Math.sqrt(lastDistX * lastDistX + lastDistY * lastDistY)

  const newDistX = Math.abs(event.touches[0].screenX - event.touches[1].screenX)
  const newDistY = Math.abs(event.touches[0].screenY - event.touches[1].screenY)
  const newDist = Math.sqrt(newDistX * newDistX + newDistY * newDistY)

  const touchCenter = {
    x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
    y: (event.touches[0].clientY + event.touches[1].clientY) / 2
  }

  const factor = newDist / lastDist
  const delta = -((factor - 1) * 1000)

  const evt = new WheelEvent('wheel', {
    isTrusted: true,
    deltaY: delta,
    altKey: event.altKey || false,
    shiftKey: event.shiftKey || false,
    ctrlKey: event.shiftKey || false,
    metaKey: event.metaKey || false,
    bubbles: true,
    cancelable: true,
    x: touchCenter.x,
    y: touchCenter.y,
    layerX: touchCenter.x,
    layerY: touchCenter.y,
    clientX: touchCenter.x,
    clientY: touchCenter.y,
    screenX: touchCenter.x,
    screenY: touchCenter.y,
    view: window,
    which: 1,
  })
  canvas.dispatchEvent(evt);
}

function actionDoubleTouchPan(event) {
  // Fingers move in the same direct => pan gesture
  const dx1 = event.touches[0].screenX - lastPositions[event.touches[0].identifier].x
  const dx2 = event.touches[1].screenX - lastPositions[event.touches[1].identifier].x
  const dy1 = event.touches[0].screenY - lastPositions[event.touches[0].identifier].y
  const dy2 = event.touches[1].screenY - lastPositions[event.touches[1].identifier].y

  const dx = (dx1 + dx2) / 2
  const dy = (dy1 + dy2) / 2

  editorWrapper.scrollLeft -= dx
  editorWrapper.scrollTop -= dy
}

function touchStartHandler(event) {
  event.preventDefault();

  const overEvent = new MouseEvent('mouseover', {
    clientX: event.touches[0].clientX,
    clientY: event.touches[0].clientY,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: mouseButtons.left,
    buttons: bitCodeMouseButton(mouseButtons.left),
    relatedTarget: event.relatedTarget || null
  });

  event.target.dispatchEvent(overEvent);

  const downEvent = new MouseEvent('mousedown', {
    clientX: event.touches[0].clientX,
    clientY: event.touches[0].clientY,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: mouseButtons.left,
    buttons: bitCodeMouseButton(mouseButtons.left),
    relatedTarget: event.relatedTarget || null
  });

  event.target.dispatchEvent(downEvent);

  if (event.touches.length === 1) {
    storedTouchStartEvent = event;
    startLongTouch();
  } else {
    storedTouchStartEvent = null;
    resetLongTouchTimer();
  }
  updatePositions(event);

}

function touchMoveHandler(event) {
  event.preventDefault();
  if (event.touches.length === 1 && Object.keys(lastPositions).length === 1 && storedTouchStartEvent !== null) {
    // One-finger touchmove
    actionSingleTouchDrag(event);
  } else if (event.touches.length === 2 && Object.keys(lastPositions).length === 2) {
    // Two-finger touchmove
    if (actionDoubleTouchPinch(event)) {
      // If pinching gesture, then perform zoom
      actionDoubleTouchZoom(event);
    } else {
      // If tap and drag with two fingers, then perform pan          
      actionDoubleTouchPan(event);
    }
  } else {
    const moveEvent = new MouseEvent('mousemove', {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: mouseButtons.left,
      buttons: bitCodeMouseButton(mouseButtons.left),
      relatedTarget: event.relatedTarget || null
    });

    event.target.dispatchEvent(moveEvent);

    activeMouseDown = true;
  }

  // *** Don't understand this bit, but do whether one- or two-finger touchmove      
  if (event.touches.length === 1 && activeMouseDown != null) {
    fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left, false);
  }

  updatePositions(event);
}

function touchEndHandler(event) {
  event.preventDefault();

  if (event.type === 'touchend' && longTouchPrimed && event.touches.length === 0) {
    console.log(JSON.stringify(storedTouchStartEvent), null, 4);
    fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.right);
    console.log(JSON.stringify(event), null, 4);
    fakeTouchEvent(event, event.changedTouches[0], mouseButtons.right);
  }  else if (event.touches.length <= 1) {
    if (activeMouseDown == null && storedTouchStartEvent != null) {
      fakeTouchEvent(storedTouchStartEvent, storedTouchStartEvent.changedTouches[0], mouseButtons.left);
    }
    fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left);
  } else {
    const upEvent = new MouseEvent('mouseup', {
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: mouseButtons.left,
      buttons: bitCodeMouseButton(mouseButtons.left),
      relatedTarget: event.relatedTarget || null
    });

    event.target.dispatchEvent(upEvent);
  }

  clearTouchBuffer();
}

function touchCancelHandler(event) {
  touchEndHandler(event);
}

// No multi-touch support (for dragging dialogs etc)
function touchSingleHandler(event) {
  fakeTouchEvent(event, event.changedTouches[0], mouseButtons.left, false)
}

$(document).ready(() => {
  canvas = document.getElementById('finalcanvas')
  if (canvas != null) {
    editorWrapper = document.getElementById('editor-wrapper')

    canvas.addEventListener("touchstart", touchStartHandler, true);
    canvas.addEventListener("touchmove", touchMoveHandler, true);
    canvas.addEventListener("touchend", touchEndHandler, true);
    canvas.addEventListener("touchcancel", touchCancelHandler, true);
    var library = document.getElementById('libraryfolderroot');
    if (library != null) {
      library.addEventListener("touchstart", touchSingleHandler, true);
      library.addEventListener("touchmove", touchSingleHandler, true);
      library.addEventListener("touchend", touchSingleHandler, true);
      library.addEventListener("touchcancel", touchSingleHandler, true);
    }
    // Once a second, see whether a new dialog was opened. If that is the case,
    // then we'll add touch listeners to it as well to make it draggable.
    setInterval(() => {
      document.querySelectorAll('.ui-dialog').forEach(dialog => {
        if (dialog.getAttribute('data-touch20') == null) {
          dialog.setAttribute('data-touch20', 'true')
          dialog.querySelectorAll('.ui-dialog-titlebar').forEach(titlebar => {
            titlebar.addEventListener("touchstart", touchSingleHandler, true);
            titlebar.addEventListener("touchmove", touchSingleHandler, true);
            titlebar.addEventListener("touchend", touchSingleHandler, true);
            titlebar.addEventListener("touchcancel", touchSingleHandler, true);
          })
        }
      })
    }, 1000)

    // Add a fullscreen toggle button
    const toolbar = document.querySelector('#floatingtoolbar > ul')
    if (toolbar != null) {
      const fullscreenButton = document.createElement('li')
      const fsIcon = document.createElement('img')
      fsIcon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD/SURBVGhD7dg9agJBHIbxTaEkCopViE3A3sYTBDyBoBJyiNxEwUMEJYdI5SXEO0Txo018ZsRGZmX/yrCi7wM/cAoH38rVRCl13z2gZlDFORURui9NGabcB/s3msDSK1YI3ZXmC6YOQ/7wm9EQlp4xQ+iuYxtcNGTpT/n3AQ3RkAhpiIZESkNuZkgF7o0Lf8q/d5w1xDWG9bEjVi+You9PSimllFLqamqgvn95FbXwtH+ZvQLWmPtT/rXhHuNH/mRIvxAjpSEaEikN0ZBIachhyBa9DLpw/z1Ze0PovmPuG/2iIRY/sNRE6J5TzENK+DbqwNIjBgjdleYTSqn7LUl2Bci5+aD+MsEAAAAASUVORK5CYII='
      fullscreenButton.appendChild(fsIcon)
      toolbar.appendChild(fullscreenButton)

      fullscreenButton.addEventListener('click', () => {
        screenfull.toggle(document.documentElement)
      })
    }
  }
})
