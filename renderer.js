// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

let shell = require('electron').shell
document.addEventListener('click', function (event) {
    if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
        event.preventDefault()
        shell.openExternal(event.target.href)
    }
})
