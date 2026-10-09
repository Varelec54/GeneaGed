const store = new Store();
const fileService = new FileService();
const ui = new UI(store);

function updateFileNameDisplay(fileName) {
  const fileInfo = document.getElementById('file-info');
  if (fileInfo) {
    fileInfo.innerText = `Fichier : ${fileName}`;
  }
}

function showMainApp(fileName) {
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeModal) {
    welcomeModal.style.display = 'none';
  }

  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.classList.remove('hidden');
    appContainer.style.display = 'flex';
  }

  updateFileNameDisplay(fileName);

  document.getElementById('btn-save')?.removeAttribute('disabled');
  document.getElementById('btn-save-as')?.removeAttribute('disabled');

  const ids = Object.keys(store.individus || {});
  if (ids.length > 0 && !store.activeIndiId) {
    store.activeIndiId = ids[0];
  }

  ui.render();
}

function parseAndLoadGedcom(text) {
  if (typeof gedcomEngine !== 'undefined' && typeof gedcomEngine.parse === 'function') {
    gedcomEngine.parse(text, store);
  } else if (typeof gedcomEngine !== 'undefined' && typeof gedcomEngine.parseGedcom === 'function') {
    gedcomEngine.parseGedcom(text, store);
  } else if (typeof store.importGedcom === 'function') {
    store.importGedcom(text);
  }
}

function exportGedcomText() {
  // Teste toutes les variantes possibles de noms de fonctions d'export
  if (typeof gedcomEngine !== 'undefined') {
    if (typeof gedcomEngine.generate === 'function') return gedcomEngine.generate(store);
    if (typeof gedcomEngine.exportGedcom === 'function') return gedcomEngine.exportGedcom(store);
    if (typeof gedcomEngine.export === 'function') return gedcomEngine.export(store);
    if (typeof gedcomEngine.stringify === 'function') return gedcomEngine.stringify(store);
    if (typeof gedcomEngine.toGedcom === 'function') return gedcomEngine.toGedcom(store);
  }
  
  if (typeof store !== 'undefined') {
    if (typeof store.exportGedcom === 'function') return store.exportGedcom();
    if (typeof store.generate === 'function') return store.generate();
    if (typeof store.toGedcom === 'function') return store.toGedcom();
    if (typeof store.stringify === 'function') return store.stringify();
  }

  console.error("Aucune fonction de génération GEDCOM n'a été trouvée !");
  return '';
}

// Vérification avant de changer de fichier
async function confirmSaveBeforeProceed() {
  const hasData = store && store.individus && Object.keys(store.individus).length > 0;
  if (hasData) {
    const wantToSave = confirm("Des modifications ont été apportées. Voulez-vous les enregistrer avant de continuer ?\n\n• Cliquez sur [ OK ] pour Enregistrer.\n• Cliquez sur [ Annuler ] pour Continuer sans enregistrer.");
    if (wantToSave) {
      await saveFile();
    }
  }
}

async function openFile() {
  await confirmSaveBeforeProceed();
  try {
    const result = await fileService.openGedcomFile();
    if (result && result.content) {
      parseAndLoadGedcom(result.content);
      store.currentFileName = result.fileName;
      showMainApp(result.fileName);
    }
  } catch (err) {
    console.error("Erreur d'ouverture :", err);
  }
}

async function newFile() {
  await confirmSaveBeforeProceed();
  if (store.clear) store.clear();
  if (store.addIndividu) store.addIndividu();
  fileService.fileHandle = null;
  store.currentFileName = 'Nouveau_fichier.ged';
  showMainApp('Nouveau_fichier.ged');
}

async function saveFileAs() {
  try {
    const content = exportGedcomText();
    const fileName = store.currentFileName || 'genealogie.ged';
    console.log("Sauvegarde sous...", fileName);
    const savedName = await fileService.saveGedcomFileAs(content, fileName);
    if (savedName) {
      store.currentFileName = savedName;
      updateFileNameDisplay(savedName);
      showNotification(`Enregistré sous ${savedName}`);
    }
  } catch (err) {
    console.error("Erreur de sauvegarde sous :", err);
  }
}

async function saveFile() {
  try {
    const content = exportGedcomText();
    const fileName = store.currentFileName || 'genealogie.ged';
    console.log("Enregistrement du fichier...", fileName);
    const savedName = await fileService.saveGedcomFile(content, fileName);
    if (savedName) {
      store.currentFileName = savedName;
      updateFileNameDisplay(savedName);
      showNotification(`Fichier ${savedName} enregistré !`);
    }
  } catch (err) {
    console.error("Erreur lors de l'enregistrement direct, bascule vers Enregistrer sous...", err);
    await saveFileAs();
  }
}

function showNotification(message) {
  let notif = document.getElementById('save-notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'save-notification';
    notif.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#28a745; color:white; padding:10px 20px; border-radius:5px; z-index:9999; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.3);';
    document.body.appendChild(notif);
  }
  notif.innerText = message;
  notif.style.display = 'block';
  setTimeout(() => { notif.style.display = 'none'; }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById('btn-open');
  if (btnOpen) btnOpen.onclick = openFile;

  const modalBtnOpen = document.getElementById('modal-btn-open');
  if (modalBtnOpen) modalBtnOpen.onclick = openFile;

  const btnNew = document.getElementById('btn-new');
  if (btnNew) btnNew.onclick = newFile;

  const modalBtnNew = document.getElementById('modal-btn-new');
  if (modalBtnNew) modalBtnNew.onclick = newFile;

  const btnSave = document.getElementById('btn-save');
  if (btnSave) btnSave.onclick = saveFile;

  const btnSaveAs = document.getElementById('btn-save-as');
  if (btnSaveAs) btnSaveAs.onclick = saveFileAs;

  const btnAdd = document.getElementById('btn-add-indi');
  if (btnAdd) {
    btnAdd.onclick = () => {
      if (store.addIndividu) store.addIndividu();
      ui.render();
    };
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      ui.render();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveFile();
    }
  });
});
