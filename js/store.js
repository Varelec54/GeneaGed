class Store {
  constructor() {
    this.individus = {};
    this.familles = {};
    this.activeIndiId = null;
    this.currentFileName = 'genealogie.ged'; // Nom par défaut
    this.fileHandle = null; // Pour conserver la référence au fichier local ouvert
    this.nextIndiIndex = 1;
    this.nextFamIndex = 1;
  }

  clear() {
    this.individus = {};
    this.familles = {};
    this.activeIndiId = null;
    this.nextIndiIndex = 1;
    this.nextFamIndex = 1;
  }

  generateIndiId() {
    while (this.individus[`I${this.nextIndiIndex}`]) {
      this.nextIndiIndex++;
    }
    return `I${this.nextIndiIndex}`;
  }

  generateFamId() {
    while (this.familles[`F${this.nextFamIndex}`]) {
      this.nextFamIndex++;
    }
    return `F${this.nextFamIndex}`;
  }

  addIndividu(nom = 'NOUVEAU', prenom = 'Individu', sexe = 'U') {
    const id = this.generateIndiId();
    const newIndi = {
      id: id,
      nom: nom,
      prenom: prenom,
      sexe: sexe,
      events: {
        BIRT: { date: '', place: '' },
        DEAT: { date: '', place: '' }
      },
      fams: [],
      famc: null
    };
    this.individus[id] = newIndi;
    return newIndi;
  }

  removeIndividu(id) {
    if (!this.individus[id]) return;

    // 1. Nettoyer les références dans les familles
    Object.values(this.familles).forEach(fam => {
      if (fam.husb === id) fam.husb = null;
      if (fam.wife === id) fam.wife = null;
      if (fam.children) {
        fam.children = fam.children.filter(cId => cId !== id);
      }
    });

    // 2. Nettoyer les familles devenues totalement vides
    Object.keys(this.familles).forEach(famId => {
      const fam = this.familles[famId];
      if (!fam.husb && !fam.wife && (!fam.children || fam.children.length === 0)) {
        delete this.familles[famId];
      }
    });

    // 3. Supprimer l'individu du store
    delete this.individus[id];

    // 4. Réinitialiser ou basculer l'individu actif
    const remainingIds = Object.keys(this.individus);
    this.activeIndiId = remainingIds.length > 0 ? remainingIds[0] : null;
  }

  updateMarriageEvent(famId, field, value) {
    const fam = this.familles[famId];
    if (!fam) return;
    if (!fam.events) fam.events = {};
    if (!fam.events.MARR) fam.events.MARR = { date: '', place: '' };
    fam.events.MARR[field] = value;
  }

  updateUnionType(famId, typeValue) {
    const fam = this.familles[famId];
    if (!fam) return;
    fam.unionType = typeValue;
  }

  updateUnionEndEvent(famId, field, value) {
    const fam = this.familles[famId];
    if (!fam) return;
    if (!fam.events) fam.events = {};
    if (!fam.events.DIV) fam.events.DIV = { type: 'DIVORCE', date: '', place: '' };
    fam.events.DIV[field] = value;
  }

  removeUnion(famId) {
    const fam = this.familles[famId];
    if (!fam) return;

    if (fam.husb && this.individus[fam.husb] && this.individus[fam.husb].fams) {
      this.individus[fam.husb].fams = this.individus[fam.husb].fams.filter(id => id !== famId);
    }

    if (fam.wife && this.individus[fam.wife] && this.individus[fam.wife].fams) {
      this.individus[fam.wife].fams = this.individus[fam.wife].fams.filter(id => id !== famId);
    }

    delete this.familles[famId];
  }

  getOrCreateFamily(id1, id2) {
    let rawHusbId = null;
    let rawWifeId = null;

    [id1, id2].forEach(id => {
      if (!id) return;
      const p = this.individus[id];
      if (p && p.sexe === 'F') {
        rawWifeId = id;
      } else if (p && p.sexe === 'M') {
        rawHusbId = id;
      } else {
        if (!rawHusbId) rawHusbId = id;
        else if (!rawWifeId) rawWifeId = id;
      }
    });

    const husbId = rawHusbId;
    const wifeId = rawWifeId;

    let targetFam = null;

    if (husbId && wifeId) {
      const existingFams = Object.values(this.familles).filter(f => 
        (f.husb === husbId && f.wife === wifeId) ||
        (f.husb === wifeId && f.wife === husbId)
      );

      if (existingFams.length > 0) {
        targetFam = existingFams[0];
        for (let i = 1; i < existingFams.length; i++) {
          const dup = existingFams[i];
          dup.children.forEach(cId => {
            if (!targetFam.children.includes(cId)) targetFam.children.push(cId);
            const cObj = this.individus[cId];
            if (cObj) cObj.famc = targetFam.id;
          });
          delete this.familles[dup.id];
        }
      }
    }

    if (!targetFam && (husbId || wifeId)) {
      targetFam = Object.values(this.familles).find(f => 
        (husbId && (f.husb === husbId || f.wife === husbId)) ||
        (wifeId && (f.husb === wifeId || f.wife === wifeId))
      );
    }

    if (!targetFam) {
      const famId = this.generateFamId();
      targetFam = {
        id: famId,
        husb: husbId || null,
        wife: wifeId || null,
        children: [],
        events: {}
      };
      this.familles[famId] = targetFam;
    } else {
      if (husbId) targetFam.husb = husbId;
      if (wifeId) targetFam.wife = wifeId;
    }

    const hObj = targetFam.husb ? this.individus[targetFam.husb] : null;
    const wObj = targetFam.wife ? this.individus[targetFam.wife] : null;

    if ((hObj && hObj.sexe === 'F') || (wObj && wObj.sexe === 'M')) {
      const temp = targetFam.husb;
      targetFam.husb = targetFam.wife;
      targetFam.wife = temp;
    }

    [targetFam.husb, targetFam.wife].forEach(pId => {
      if (pId) {
        const pObj = this.individus[pId];
        if (pObj) {
          if (!pObj.fams) pObj.fams = [];
          if (!pObj.fams.includes(targetFam.id)) {
            pObj.fams.push(targetFam.id);
          }
        }
      }
    });

    return targetFam;
  }

  setParent(childId, parentId, role) {
    const child = this.individus[childId];
    const parent = this.individus[parentId];
    if (!child || !parent) return;

    let currentFam = child.famc ? this.familles[child.famc] : null;
    let husbId = currentFam ? currentFam.husb : null;
    let wifeId = currentFam ? currentFam.wife : null;

    if (role === 'father') husbId = parentId;
    if (role === 'mother') wifeId = parentId;

    const targetFam = this.getOrCreateFamily(husbId, wifeId);

    if (currentFam && currentFam.id !== targetFam.id) {
      currentFam.children = currentFam.children.filter(id => id !== childId);
      if (currentFam.children.length === 0 && !currentFam.husb && !currentFam.wife) {
        delete this.familles[currentFam.id];
      }
    }

    if (!targetFam.children) targetFam.children = [];
    if (!targetFam.children.includes(childId)) {
      targetFam.children.push(childId);
    }
    child.famc = targetFam.id;
  }

  addChildToParents(primaryParentId, otherParentId) {
    const primaryParent = this.individus[primaryParentId];
    if (!primaryParent) return null;

    let husbId = null;
    let wifeId = null;

    const otherParent = otherParentId ? this.individus[otherParentId] : null;

    if (primaryParent.sexe === 'M') {
      husbId = primaryParent.id;
      if (otherParent) wifeId = otherParent.id;
    } else if (primaryParent.sexe === 'F') {
      wifeId = primaryParent.id;
      if (otherParent) husbId = otherParent.id;
    } else {
      if (otherParent && otherParent.sexe === 'M') {
        husbId = otherParent.id;
        wifeId = primaryParent.id;
      } else if (otherParent && otherParent.sexe === 'F') {
        wifeId = otherParent.id;
        husbId = primaryParent.id;
      } else {
        husbId = primaryParent.id;
        if (otherParent) wifeId = otherParent.id;
      }
    }

    const targetFam = this.getOrCreateFamily(husbId, wifeId);

    const childNom = primaryParent.sexe === 'M' ? primaryParent.nom : (otherParent && otherParent.sexe === 'M' ? otherParent.nom : primaryParent.nom);
    const child = this.addIndividu(childNom, 'Enfant', 'U');

    if (!targetFam.children.includes(child.id)) {
      targetFam.children.push(child.id);
    }
    child.famc = targetFam.id;

    return child;
  }

  linkExistingChildToParents(childId, primaryParentId, otherParentId) {
    const child = this.individus[childId];
    const primaryParent = this.individus[primaryParentId];
    if (!child || !primaryParent) return;

    let husbId = null;
    let wifeId = null;
    const otherParent = otherParentId ? this.individus[otherParentId] : null;

    if (primaryParent.sexe === 'M') {
      husbId = primaryParent.id;
      if (otherParent) wifeId = otherParent.id;
    } else if (primaryParent.sexe === 'F') {
      wifeId = primaryParent.id;
      if (otherParent) husbId = otherParent.id;
    } else {
      husbId = primaryParent.id;
      if (otherParent) wifeId = otherParent.id;
    }

    const targetFam = this.getOrCreateFamily(husbId, wifeId);

    if (!targetFam.children.includes(child.id)) {
      targetFam.children.push(child.id);
    }
    child.famc = targetFam.id;
  }
}
