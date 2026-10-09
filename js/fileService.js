class FileService {
  constructor() {
    this.fileHandle = null;
  }

  async openGedcomFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Fichiers GEDCOM', accept: { 'text/plain': ['.ged'] } }]
        });
        this.fileHandle = handle;
        const file = await handle.getFile();
        const content = await file.text();
        return { fileName: file.name, content };
      } catch (err) {
        if (err.name === 'AbortError') return null;
        throw err;
      }
    } else {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ged';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            const content = await file.text();
            resolve({ fileName: file.name, content });
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }
  }

  async saveGedcomFile(content, suggestedName = 'genealogie.ged') {
    if (this.fileHandle && 'createWritable' in this.fileHandle) {
      const writable = await this.fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return this.fileHandle.name;
    } else {
      return this.saveGedcomFileAs(content, suggestedName);
    }
  }

  async saveGedcomFileAs(content, suggestedName = 'genealogie.ged') {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{ description: 'Fichier GEDCOM', accept: { 'text/plain': ['.ged'] } }]
        });
        this.fileHandle = handle;
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return handle.name;
      } catch (err) {
        if (err.name === 'AbortError') return null;
        throw err;
      }
    } else {
      const fileName = (suggestedName && suggestedName.trim() !== '') ? suggestedName : 'genealogie.ged';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      return fileName;
    }
  }
}
