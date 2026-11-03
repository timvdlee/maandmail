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
    populateMonthSelector();
    
    populateDefaultBlocks();
    
    automaticMonthDetection();
}

function populateMonthSelector() {
    const maandSelector = document.getElementById("maandSelector");
    let now = new Date();
    let currentMonth = now.getMonth(); // 0-indexed
    const maanden = [
        "Januari", "Februari", "Maart", "April", "Mei", "Juni",
        "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];
    // Populate the dropdown with Months do they current month the three months before and three after. Take a new year into account (Append the year)
    for (let i = -3; i <= 3; i++) {
        let monthIndex = (currentMonth + i + 12) % 12;
        let year = now.getFullYear() + Math.floor((currentMonth + i) / 12);
        let option = document.createElement("option");
        option.value = `${monthIndex}-${year}`;
        option.textContent = `${maanden[monthIndex]} ${year}`;
        maandSelector.appendChild(option);
    }
    // set the current month as selected
    maandSelector.value = `${currentMonth}-${now.getFullYear()}`;

    maandSelector.addEventListener("change", automaticMonthDetection);

}

function getSelectedMonthAsDateObject() {
    const maandSelector = document.getElementById("maandSelector");
    const selectedMonthIndex = parseInt(maandSelector.value.split('-')[0], 10);
    const year = parseInt(maandSelector.value.split('-')[1], 10);
    return new Date(year, selectedMonthIndex, 1);
}
    



function automaticMonthDetection() {
    let monthElement = document.getElementById("maandMarker");
    let selectedMonth = getSelectedMonthAsDateObject();
    let month = selectedMonth.toLocaleString("nl-NL", { month: "long" });
    monthElement.innerHTML = "Maandmail " + month;
}

async function addOpkomstAutomatic() {
    if (!confirm("Opkomsten zullen automatisch worden opgehaald vanuit de groepsagenda. Alle huidige opkomsten in de maandmail zullen worden verwijderd. Wil je doorgaan?")) {
        return;
    }
    const ssl_knoppen = document.getElementById("ssl-knoppen");
    // Verwijder alle huidige opkomsten
    const activiteiten = await haalActiviteitenHuidigeMaandOp();

    if (!activiteiten || activiteiten.length === 0) {
        return;
    }

    ssl_knoppen.querySelectorAll(".remove-button").forEach(e => e.click());

    for (const activiteit of activiteiten) {
        let clone = addOpkomst();

        clone.querySelector("#opkomst-titel").textContent = activiteit.titel;
        if (!activiteit.isHeleDag) {
            clone.querySelector("#opkomst-datum").textContent = activiteit.singleDateDesc + " " + activiteit.tijd;
        }else if (activiteit.isHeleDag && activiteit.singleDay) {
            clone.querySelector("#opkomst-datum").textContent = activiteit.singleDateDesc;
        }else if (activiteit.isHeleDag && activiteit.multipleDay) {
            clone.querySelector("#opkomst-datum").textContent = activiteit.multiDateDesc;
        }
    }
}

async function haalActiviteitenHuidigeMaandOp() {
    const API_KEY = 'AIzaSyAMCRidISql-5TNZFlfJZ9KiqyjXtRjMu4';
    const CALENDAR_ID = 'studentensleutelstam@gmail.com';


    // 1. Bereken de start- en einddatum van de HUIDIGE maand
    const currentSelectedMonth = getSelectedMonthAsDateObject();

  // Eerste dag van de huidige maand (00:00:00)
    const eersteDag = new Date(currentSelectedMonth.getFullYear(), currentSelectedMonth.getMonth(), 1, 0, 0, 0);
    
    // Gebruik de eerste dag van de volgende maand als EXCLUSIEVE bovengrens.
    // Dit voorkomt timezone-randproblemen en is in lijn met de Calendar API (timeMax exclusief).
    const eersteDagVolgendeMaand = new Date(currentSelectedMonth.getFullYear(), currentSelectedMonth.getMonth() + 1, 1, 0, 0, 0);

    const timeMin = eersteDag.toISOString();
    const timeMax = eersteDagVolgendeMaand.toISOString();

    // 2. Bouw de Google Calendar API URL
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`);
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '2500');


    // Wrap the get request in try catch block to handle potential errors

    
    const response = await fetch(url.toString());

    if (!response.ok) {
        console.error(`Error fetching events: ${response.status} ${response.statusText}`);
        alert("Er is een fout opgetreden bij het ophalen van de activiteiten.");
        return NULL;
    }
    
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    
    // 3. Map de Google data naar een schoon, bruikbaar JSON-lijstje
    const opgeschoondeActiviteiten = items.map(event => {
     // Soms is een evenement een 'all-day event' (zonder tijd), dan gebruiken we event.start.date
    const isHeleDag = !event.start.dateTime;
    const startTijdstip = new Date(event.start.dateTime || event.start.date);
    const eindTijdstip = new Date(event.end.dateTime || event.end.date);
    const exactly24h = (eindTijdstip - startTijdstip) === 24 * 60 * 60 * 1000; // Check of het precies 24 uur is
    const moreThan24h = (eindTijdstip - startTijdstip) > 24 * 60 * 60 * 1000; // Check of het meer dan 24 uur is

    return {
        titel: event.summary || 'Geen titel',
        isHeleDag: isHeleDag,
        // Datum formatteren voor je HTML template (bijv. "14 november")
        singleDateDesc: startTijdstip.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }),
        // Datum bereik formatteren (bijv. "14 t/m 15 november")
        multiDateDesc: startTijdstip.toLocaleDateString('nl-NL', { day: 'numeric'}) + " t/m " + eindTijdstip.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }),
        // Tijd formatteren (bijv. "20:00")
        tijd: isHeleDag ? 'Hele dag' : startTijdstip.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        // Ruwe datums voor het geval je er zelf nog mee wilt rekenen
        rawStart: startTijdstip,
        rawEnd: eindTijdstip,
        singleDay : exactly24h,
        multipleDay : moreThan24h,
    };
});

    return opgeschoondeActiviteiten;

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
    let dest = document.getElementById(element_dest);
    let clone = htmlTemplate.content.cloneNode(true);
    clone.firstElementChild.dataset.id = id;
    clone.firstElementChild.id = id; // Assign the unique ID to the clone
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
    return document.getElementById(id); // Return the clone for further manipulation if needed
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
    let verjaardagObject = document.getElementById(id);
    let currentSelectedMonth = getSelectedMonthAsDateObject();
    let monthNumeric = currentSelectedMonth.toLocaleString("nl-NL", { month: "numeric" });
    verjaardagObject.querySelector('.verjaardagObj').textContent = `xx-${monthNumeric}`;
    return document.getElementById(id); // Return the clone for further manipulation if needed
}

function addOverig() {
    let id = crypto.randomUUID();
    addTemplate(id, "templateOverig", "overig-mededelingen");
    addRemoveButton(id, "ovr-knoppen", "Sectie overig verwijderen");
}
