import './style/main.less'

import $ from 'jquery'
import screenfull from 'screenfull'

let canvas = null;

function simpleTouchHandler(event) {

}

function canvasPointerHandler(event){
  if (event.type === 'pointerdown') {
    try {
      event.preventDefault();
      let mevt = new MouseEvent('mousedown', {
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons
      });
      canvas.dispatchEvent(mevt);
    } catch (err) {
      console.log(err);
    }
  } else if (event.type === 'pointermove') {
    try {
      event.preventDefault();
      let mevt = new MouseEvent('mousemove', {
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons
      });
      console.log("pointerup");
      canvas.dispatchEvent(mevt);
    } catch (err) {
      console.log(err);
    }
  } else if (event.type === 'pointerup') {
    try {
      event.preventDefault();
      let mevt = new MouseEvent('mouseup', {
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons
      })
      canvas.dispatchEvent(mevt);
    } catch (err) {
      console.log(err);
    }
  } else if (event.type === 'pointercancel') {
    try {
      event.preventDefault();
      let mevt = new MouseEvent('mousecancel', {
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons
      })
      canvas.dispatchEvent(mevt);
    } catch (err) {
      console.log(err);
    }
  }
}

$(document).ready(() => {
  canvas = document.getElementById('finalcanvas')
  if (canvas != null) {
    editorWrapper = document.getElementById('editor-wrapper')

    canvas.addEventListener("pointerdown", canvasPointerHandler, false);
    canvas.addEventListener("pointermove", canvasPointerHandler, false);
    canvas.addEventListener("pointerup", canvasPointerHandler, false);
    canvas.addEventListener("pointercancel", canvasPointerHandler, false);
    /*var library = document.getElementById('libraryfolderroot');
    if (library != null) {
      library.addEventListener("touchstart", simpleTouchHandler, true);
      library.addEventListener("touchmove", simpleTouchHandler, true);
      library.addEventListener("touchend", simpleTouchHandler, true);
      library.addEventListener("touchcancel", simpleTouchHandler, true);
    }
    // Once a second, see whether a new dialog was opened. If that is the case,
    // then we'll add touch listeners to it as well to make it draggable.
    setInterval(() => {
      document.querySelectorAll('.ui-dialog').forEach(dialog => {
        if (dialog.getAttribute('data-touch20') == null) {
          dialog.setAttribute('data-touch20', 'true')
          dialog.querySelectorAll('.ui-dialog-titlebar').forEach(titlebar => {
            titlebar.addEventListener("touchstart", simpleTouchHandler, true);
            titlebar.addEventListener("touchmove", simpleTouchHandler, true);
            titlebar.addEventListener("touchend", simpleTouchHandler, true);
            titlebar.addEventListener("touchcancel", simpleTouchHandler, true);
          })
        }
      })
    }, 1000)
    */
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
