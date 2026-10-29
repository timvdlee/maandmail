window.addEventListener('load', function () {
let loadBtn = document.getElementById("load_content")
let emergencyLoadBtn = document.getElementById("emergency_content")
let saveBtn = document.getElementById("save_content")
let content = document.getElementById('content');

    saveBtn.addEventListener('click', () => {
        if (this.confirm("Wil je de huidige inhoud opslaan? Dit overschrijft de huidige opgeslagen inhoud.")) {
        localStorage.setItem('content', content.innerHTML);
        }
    });

    loadBtn.addEventListener('click', () => {
        if (this.confirm("Wil je de opgeslagen maandmail inladen? Dit overschrijft de huidige inhoud.")) {
        content.innerHTML = localStorage.getItem('content');
        document.querySelectorAll(".remove-button").forEach(e => e.onclick = function () { removeAllWithId(e) });
        }
    });

    emergencyLoadBtn.addEventListener('click', () => {
        if (this.confirm("Wil je de meest recente afgesloten pagina inladen?? Dit overschrijft de huidige inhoud.")) {
        content.innerHTML = localStorage.getItem('closed_content');
        document.querySelectorAll(".remove-button").forEach(e => e.onclick = function () { removeAllWithId(e) });
        }
    });
});

window.addEventListener("beforeunload", function(e){
    localStorage.setItem('closed_content', document.getElementById('content').innerHTML);
});

window.onbeforeunload = function() {
    return true;
};

window.onload = function () {
    document.querySelectorAll(".remove-button").forEach(e => e.onclick = function () { removeAllWithId(e) });
}


function copyMaandmail() {
    let maandmail = document.getElementById("maandmail");
    let selection = window.getSelection();
    let range = document.createRange();
    range.selectNodeContents(maandmail);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
    alert("Maandmail is gekopieerd. Je kan hem nu plakken in Gmail met Ctrl+V.");
}

function addTemplate(id, template, element_dest) {
    let temp = document.getElementById(template);
    let dest = document.getElementById(element_dest);
    let clone = temp.content.cloneNode(true);
    clone.firstElementChild.dataset.id = id;
    dest.appendChild(clone);
}

function addRemoveButton(id, button_dest, button_text) {
    let button = document.createElement("button");
    button.type = "button"
    button.classList.add("remove-button")
    button.dataset.id = id;
    button.innerHTML = button_text;
    button.onclick = function () { removeAllWithId(button) };
    document.getElementById(button_dest).appendChild(button);
}

function removeAllWithId(element) {
    document.querySelectorAll(`[data-id="${element.dataset.id}"]`).forEach(e => e.remove());
}

function addOpkomst() {
    let id = Date.now();
    addTemplate(id, "opkomst-template", "ssl-activiteiten")
    addRemoveButton(id, "ssl-knoppen", "Opkomst verwijderen")
}

function addBorrel() {
    let id = Date.now();
    addTemplate(id, "borrel-template", "ssl-activiteiten")
    addRemoveButton(id, "ssl-knoppen", "Borrel verwijderen")
}

function addActiviteitSSL() {
    let id = Date.now();
    addTemplate(id, "activiteit-template", "ssl-activiteiten")
    addRemoveButton(id, "ssl-knoppen", "Activiteit verwijderen")
}

function addActiviteitSSN() {
    let id = Date.now();
    addTemplate(id, "activiteit-template", "ssn-activiteiten")
    addRemoveButton(id, "ssn-knoppen", "Activiteit verwijderen")
}

function addCommissieMededeling() {
    let id = Date.now();
    addTemplate(id, "mededeling-template", "commissie-mededelingen")
    addRemoveButton(id, "com-knoppen", "Mededeling verwijderen")
}

function addBestuurMededeling() {
    let id = Date.now();
    addTemplate(id, "mededeling-template", "bestuur-mededelingen")
    addRemoveButton(id, "bes-knoppen", "Mededeling verwijderen")
}

function addVerjaardag() {
    let id = Date.now();
    addTemplate(id, "verjaardag-template", "verjaardagen")
    addRemoveButton(id, "ver-knoppen", "Verjaardag verwijderen")

}

function addOverig() {
    let id = Date.now();
    addTemplate(id, "templateOverig", "overig-mededelingen")
    addRemoveButton(id, "ovr-knoppen", "Sectie overig verwijderen")

}

