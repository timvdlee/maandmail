window.addEventListener("DOMContentLoaded", initialiseerMaandmail);

window.addEventListener("beforeunload", function () {
    localStorage.setItem("closed_content", document.getElementById("content").innerHTML);
});

async function initialiseerMaandmail() {

    // Fetch templates.html and load them into the DOM
    await loadTemplatesIntoDom();

    // Locate buttons and content area
    let loadBtn = document.getElementById("load_content");
    let emergencyLoadBtn = document.getElementById("emergency_content");
    let saveBtn = document.getElementById("save_content");
    let content = document.getElementById("content");

    // Save current content to localStorage when save button is clicked
    saveBtn.addEventListener("click", () => {
        if (window.confirm("Wil je de huidige inhoud opslaan? Dit overschrijft de huidige opgeslagen inhoud.")) {
            localStorage.setItem("content", content.innerHTML);
        }
    });

    // Load saved content from localStorage when load button is clicked
    loadBtn.addEventListener("click", () => {
        if (window.confirm("Wil je de opgeslagen maandmail inladen? Dit overschrijft de huidige inhoud.")) {
            const savedContent = localStorage.getItem("content");
            if (savedContent) {
                content.innerHTML = savedContent;
                bindRemoveButtons();
            }
        }
    });

    // Load content automatically saved on page close when emergency load button is clicked
    emergencyLoadBtn.addEventListener("click", () => {
        if (window.confirm("Wil je de meest recente afgesloten pagina inladen? Dit overschrijft de huidige inhoud.")) {
            const emergencyContent = localStorage.getItem("closed_content");
            if (emergencyContent) {
                content.innerHTML = emergencyContent;
                bindRemoveButtons();
            }
        }
    });
    // Populate default blocks on page load
    // (1x opkomst, 1x activiteit SSN, 1x commissie mededeling, 1x bestuur mededeling, 1x overig, 1x verjaardag)
    populateDefaultBlocks();

}

async function loadTemplatesIntoDom() {
    const response = await fetch("templates.html", { cache: "no-store" });
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const templates = parsed.querySelectorAll("template[id]");

    templates.forEach((template) => {
        const existing = document.getElementById(template.id);
        if (existing) {
            existing.remove();
        }
        document.body.appendChild(template);
    });
}



function bindRemoveButtons() {
    document.querySelectorAll(".remove-button").forEach((button) => {
        button.onclick = function () {
            removeAllWithId(button);
        };
    });
}

function populateDefaultBlocks() {
    addOpkomst();
    addActiviteitSSN();
    addCommissieMededeling();
    addBestuurMededeling();
    addOverig();
    addVerjaardag();
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
    let htmlTemplate = document.getElementById(template);
    if (!htmlTemplate) {
        ensureTemplatesLoaded()
            .then(() => {
                const loadedTemplate = document.getElementById(template);
                let destAfterLoad = document.getElementById(element_dest);
                let cloneAfterLoad = loadedTemplate.content.cloneNode(true);
                cloneAfterLoad.firstElementChild.dataset.id = id;
                destAfterLoad.appendChild(cloneAfterLoad);
            })
            .catch((error) => {
                console.error(error);
                alert("Template kon niet geladen worden. Herlaad de pagina.");
            });
        return;
    }
    let dest = document.getElementById(element_dest);
    let clone = htmlTemplate.content.cloneNode(true);
    clone.firstElementChild.dataset.id = id;
    dest.appendChild(clone);
}

function addRemoveButton(id, button_dest, button_text) {
    let button = document.createElement("button");
    button.type = "button";
    button.classList.add("remove-button");
    button.dataset.id = id;
    button.innerHTML = button_text;
    button.onclick = function () { removeAllWithId(button); };
    document.getElementById(button_dest).appendChild(button);
}

function removeAllWithId(element) {
    document.querySelectorAll(`[data-id="${element.dataset.id}"]`).forEach(e => e.remove());
}

function addOpkomst() {
    let id = crypto.randomUUID();
    addTemplate(id, "opkomst-template", "ssl-activiteiten");
    addRemoveButton(id, "ssl-knoppen", "Opkomst verwijderen");
}

function addBorrel() {
    let id = crypto.randomUUID();
    addTemplate(id, "borrel-template", "ssl-activiteiten");
    addRemoveButton(id, "ssl-knoppen", "Borrel verwijderen");
}

function addActiviteitSSL() {
    let id = crypto.randomUUID();
    addTemplate(id, "activiteit-template", "ssl-activiteiten");
    addRemoveButton(id, "ssl-knoppen", "Activiteit verwijderen");
}

function addActiviteitSSN() {
    let id = crypto.randomUUID();
    addTemplate(id, "activiteit-template", "ssn-activiteiten");
    addRemoveButton(id, "ssn-knoppen", "Activiteit verwijderen");
}

function addCommissieMededeling() {
    let id = crypto.randomUUID();
    addTemplate(id, "mededeling-template", "commissie-mededelingen");
    addRemoveButton(id, "com-knoppen", "Mededeling verwijderen");
}

function addBestuurMededeling() {
    let id = crypto.randomUUID();
    addTemplate(id, "mededeling-template", "bestuur-mededelingen");
    addRemoveButton(id, "bes-knoppen", "Mededeling verwijderen");
}

function addVerjaardag() {
    let id = crypto.randomUUID();
    addTemplate(id, "verjaardag-template", "verjaardagen");
    addRemoveButton(id, "ver-knoppen", "Verjaardag verwijderen");
}

function addOverig() {
    let id = crypto.randomUUID();
    addTemplate(id, "templateOverig", "overig-mededelingen");
    addRemoveButton(id, "ovr-knoppen", "Sectie overig verwijderen");
}
