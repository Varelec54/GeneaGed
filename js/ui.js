class UI {
  constructor(store) {
    this.store = store;
    this.currentParentRole = null;
    this.bindInputs();
    this.initSpouseModal();
    this.initChildModal();
  }

  // --- Fonction utilitaire pour trier les identifiants d'individus par ordre alphabétique ---
  sortIndividus(idsArray) {
    return [...idsArray].sort((a, b) => {
      const indiA = this.store.individus[a];
      const indiB = this.store.individus[b];
      
      const nomA = (indiA?.nom || '').toLowerCase();
      const nomB = (indiB?.nom || '').toLowerCase();
      
      if (nomA !== nomB) {
        return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
      }
      
      const prenomA = (indiA?.prenom || '').toLowerCase();
      const prenomB = (indiB?.prenom || '').toLowerCase();
      return prenomA.localeCompare(prenomB, 'fr', { sensitivity: 'base' });
    });
  }

  bindInputs() {
    const bind = (id, callback) => {
      const el = document.getElementById(id);
      if (el) {
        el.oninput = (e) => {
          const activeIndi = this.store.individus[this.store.activeIndiId];
          if (activeIndi) callback(activeIndi, e.target.value);
        };
      }
    };

    bind('indi-nom', (indi, val) => {
      indi.nom = val;
      this.updateSidebarName(indi.id, `${indi.nom.toUpperCase()} ${indi.prenom}`);
    });

    bind('indi-prenom', (indi, val) => {
      indi.prenom = val;
      this.updateSidebarName(indi.id, `${indi.nom.toUpperCase()} ${indi.prenom}`);
    });

    bind('indi-sexe', (indi, val) => { indi.sexe = val; });

    bind('indi-birth-date', (indi, val) => {
      if (!indi.events.BIRT) indi.events.BIRT = {};
      indi.events.BIRT.date = val;
    });

    bind('indi-birth-place', (indi, val) => {
      if (!indi.events.BIRT) indi.events.BIRT = {};
      indi.events.BIRT.place = val;
    });

    bind('indi-death-date', (indi, val) => {
      if (!indi.events.DEAT) indi.events.DEAT = {};
      indi.events.DEAT.date = val;
    });

    bind('indi-death-place', (indi, val) => {
      if (!indi.events.DEAT) indi.events.DEAT = {};
      indi.events.DEAT.place = val;
    });
  }

  updateSidebarName(id, newName) {
    const li = document.querySelector(`#indi-list li[data-id="${id}"]`);
    if (li) li.innerText = newName;
  }

  initSpouseModal() {
    const modal = document.getElementById('spouse-modal');
    const btnCancel = document.getElementById('spouse-modal-cancel');
    const btnConfirm = document.getElementById('spouse-modal-confirm');

    if (btnCancel) {
      btnCancel.onclick = () => { if (modal) modal.classList.add('hidden'); };
    }

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const select = document.getElementById('spouse-select');
        const spouseId = select ? select.value : null;
        if (spouseId) this.createUnionWith(spouseId);
        if (modal) modal.classList.add('hidden');
      };
    }
  }

  openSpouseModal() {
    const activeIndi = this.store.individus[this.store.activeIndiId];
    if (!activeIndi) return;

    const availableSpousesIds = Object.keys(this.store.individus).filter(id => id !== activeIndi.id);
    if (availableSpousesIds.length === 0) {
      alert("Aucun autre individu disponible. Veuillez d'abord créer un second individu.");
      return;
    }

    const sortedSpousesIds = this.sortIndividus(availableSpousesIds);

    const select = document.getElementById('spouse-select');
    if (select) {
      select.innerHTML = '';
      sortedSpousesIds.forEach(id => {
        const s = this.store.individus[id];
        const option = document.createElement('option');
        option.value = s.id;
        option.innerText = `${s.nom.toUpperCase()} ${s.prenom}`;
        select.appendChild(option);
      });
    }

    const modal = document.getElementById('spouse-modal');
    if (modal) modal.classList.remove('hidden');
  }

  createUnionWith(spouseId) {
    const activeIndi = this.store.individus[this.store.activeIndiId];
    const spouse = this.store.individus[spouseId];
    if (!activeIndi || !spouse) return;

    let husbId = null;
    let wifeId = null;

    if (activeIndi.sexe === 'F') {
      wifeId = activeIndi.id;
      husbId = spouse.id;
    } else {
      husbId = activeIndi.id;
      wifeId = spouse.id;
    }

    this.store.getOrCreateFamily(husbId, wifeId);
    this.render();
  }

  initChildModal() {
    const modal = document.getElementById('child-modal');
    const btnCancel = document.getElementById('child-modal-cancel');
    const btnConfirm = document.getElementById('child-modal-confirm');
    const modeSelect = document.getElementById('child-mode-select');
    const existingGroup = document.getElementById('child-existing-group');

    if (modeSelect) {
      modeSelect.onchange = (e) => {
        if (existingGroup) {
          existingGroup.style.display = (e.target.value === 'existing') ? 'block' : 'none';
        }
      };
    }

    if (btnCancel) {
      btnCancel.onclick = () => { if (modal) modal.classList.add('hidden'); };
    }

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        const mode = modeSelect ? modeSelect.value : 'new';
        const otherParentSelect = document.getElementById('other-parent-select');
        let otherParentId = (otherParentSelect && otherParentSelect.value !== '') ? otherParentSelect.value : null;

        if (otherParentId === '__NEW__') {
          const primaryParent = this.store.individus[this.store.activeIndiId];
          const defaultNom = primaryParent ? primaryParent.nom : 'NOUVEAU';
          const defaultSexe = (primaryParent && primaryParent.sexe === 'M') ? 'F' : 'M';

          const newParent = this.store.addIndividu(defaultNom, 'Conjoint', defaultSexe);
          otherParentId = newParent.id;
        }

        if (mode === 'existing') {
          const childSelect = document.getElementById('child-select');
          const childId = childSelect ? childSelect.value : null;
          if (childId) {
            this.store.linkExistingChildToParents(childId, this.store.activeIndiId, otherParentId);
            this.store.activeIndiId = childId;
          }
        } else {
          const child = this.store.addChildToParents(this.store.activeIndiId, otherParentId);
          if (child) this.store.activeIndiId = child.id;
        }

        if (modal) modal.classList.add('hidden');
        this.render();
      };
    }
  }

  openChildModal() {
    const activeIndi = this.store.individus[this.store.activeIndiId];
    if (!activeIndi) return;

    const modeSelect = document.getElementById('child-mode-select');
    const existingGroup = document.getElementById('child-existing-group');

    if (modeSelect) modeSelect.value = 'new';
    if (existingGroup) existingGroup.style.display = 'none';

    const availableChildrenIds = Object.keys(this.store.individus).filter(id => id !== activeIndi.id);
    const sortedChildrenIds = this.sortIndividus(availableChildrenIds);

    const childSelect = document.getElementById('child-select');
    if (childSelect) {
      childSelect.innerHTML = '';
      sortedChildrenIds.forEach(id => {
        const c = this.store.individus[id];
        const option = document.createElement('option');
        option.value = c.id;
        option.innerText = `${c.nom.toUpperCase()} ${c.prenom}`;
        childSelect.appendChild(option);
      });
    }

    const otherParentSelect = document.getElementById('other-parent-select');
    if (otherParentSelect) {
      otherParentSelect.innerHTML = `
        <option value="">-- Aucun second parent (Parent seul) --</option>
        <option value="__NEW__" style="font-weight:bold; color:#0066cc;">+ Créer un nouveau parent</option>
      `;

      const availableParentsIds = Object.keys(this.store.individus).filter(id => id !== activeIndi.id);
      const sortedParentsIds = this.sortIndividus(availableParentsIds);

      sortedParentsIds.forEach(id => {
        const p = this.store.individus[id];
        const option = document.createElement('option');
        option.value = p.id;
        option.innerText = `${p.nom.toUpperCase()} ${p.prenom}`;
        otherParentSelect.appendChild(option);
      });
    }

    const modal = document.getElementById('child-modal');
    if (modal) modal.classList.remove('hidden');
  }

  detachChildFromActiveFamily(childId) {
    const activeIndi = this.store.individus[this.store.activeIndiId];
    if (!activeIndi || !activeIndi.fams) return;

    activeIndi.fams.forEach(famId => {
      const fam = this.store.familles[famId];
      if (fam && fam.children && fam.children.includes(childId)) {
        fam.children = fam.children.filter(id => id !== childId);
      }
    });

    const child = this.store.individus[childId];
    if (child && child.famc) {
      const fam = this.store.familles[child.famc];
      if (fam && (fam.husb === activeIndi.id || fam.wife === activeIndi.id)) {
        child.famc = null;
      }
    }
  }

  // --- Méthode dédiée pour générer l'arbre généalogique ---
  renderGenealogyTree(activeIndi, editorContent) {
    let treeContainer = document.getElementById('genealogy-tree-section');
    if (!treeContainer) {
      treeContainer = document.createElement('div');
      treeContainer.id = 'genealogy-tree-section';
      treeContainer.className = 'genealogy-tree-container';
      editorContent.appendChild(treeContainer);
    }

    // Styles de défilement
    treeContainer.style.overflowX = 'auto';
    treeContainer.style.maxWidth = '100%';
    treeContainer.style.paddingBottom = '15px';
    treeContainer.style.userSelect = 'none';

    // Navigation par glisser-déposer (Drag to Scroll) & Molette
    if (!treeContainer.dataset.dragInitialized) {
      let isDown = false;
      let startX;
      let scrollLeft;

      treeContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('a, button, input, select')) return;
        isDown = true;
        treeContainer.style.cursor = 'grabbing';
        startX = e.pageX - treeContainer.offsetLeft;
        scrollLeft = treeContainer.scrollLeft;
      });

      treeContainer.addEventListener('mouseleave', () => {
        isDown = false;
        treeContainer.style.cursor = 'default';
      });

      treeContainer.addEventListener('mouseup', () => {
        isDown = false;
        treeContainer.style.cursor = 'default';
      });

      treeContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - treeContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        treeContainer.scrollLeft = scrollLeft - walk;
      });

      treeContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          treeContainer.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      treeContainer.dataset.dragInitialized = 'true';
    }

    const formatDates = (indi) => {
      let str = '';
      const b = indi.events?.BIRT;
      const d = indi.events?.DEAT;
      if (b && (b.date || b.place)) str += `° ${b.date || ''} ${b.place || ''}<br>`;
      if (d && (d.date || d.place)) str += `† ${d.date || ''} ${d.place || ''}`;
      return str;
    };
    
    const createCardHtml = (indi, extraHtml = '', cardType = 'default') => {
      if (!indi) return '';
      const nameStr = `${indi.nom ? indi.nom.toUpperCase() : ''} ${indi.prenom || ''}`;
      const datesHtml = formatDates(indi);

      return `
        <div class="tree-card ${cardType}">
          <a href="#" data-id="${indi.id}" class="link-indi card-name">${nameStr}</a>
          ${datesHtml ? `<div class="card-details">${datesHtml}</div>` : ''}
          ${extraHtml ? `<div class="card-spouse-info" style="margin-top:4px; width:100%;">${extraHtml}</div>` : ''}
        </div>
      `;
    };

    // Famille ascendante de l'individu principal
    let famc = activeIndi.famc ? this.store.familles[activeIndi.famc] : null;
    if (!famc) {
      famc = Object.values(this.store.familles).find(f => f.children && f.children.includes(activeIndi.id));
    }

    // Trouver le conjoint principal et sa famille ascendante
    let spouseObj = null;
    let famcSpouse = null;
    let marriageDateStr = '';
    (activeIndi.fams || []).forEach(famId => {
      const fam = this.store.familles[famId];
      if (fam) {
        const spouseId = (fam.husb === activeIndi.id) ? fam.wife : fam.husb;
        if (spouseId) {
          spouseObj = this.store.individus[spouseId];
          if (fam.events?.MARR?.date) {
            marriageDateStr = fam.events.MARR.date;
          }
        }
      }
    });

    if (spouseObj) {
      famcSpouse = spouseObj.famc ? this.store.familles[spouseObj.famc] : null;
      if (!famcSpouse) {
        famcSpouse = Object.values(this.store.familles).find(f => f.children && f.children.includes(spouseObj.id));
      }
    }

    // --- 1. GRANDS-PARENTS & BEAUX-GRANDS-PARENTS ---
    let gpHtml = '';
    if (famc) {
      [famc.husb, famc.wife].forEach(pId => {
        if (pId) {
          const parentObj = this.store.individus[pId];
          let parentFamc = parentObj?.famc ? this.store.familles[parentObj.famc] : null;
          if (!parentFamc && parentObj) {
            parentFamc = Object.values(this.store.familles).find(f => f.children && f.children.includes(parentObj.id));
          }
          if (parentFamc) {
            [parentFamc.husb, parentFamc.wife].forEach(gpId => {
              if (gpId) {
                const gpObj = this.store.individus[gpId];
                if (gpObj) gpHtml += createCardHtml(gpObj, '', 'default');
              }
            });
          }
        }
      });
    }

    let inLawGpHtml = '';
    if (famcSpouse) {
      [famcSpouse.husb, famcSpouse.wife].forEach(pId => {
        if (pId) {
          const parentObj = this.store.individus[pId];
          let parentFamc = parentObj?.famc ? this.store.familles[parentObj.famc] : null;
          if (!parentFamc && parentObj) {
            parentFamc = Object.values(this.store.familles).find(f => f.children && f.children.includes(parentObj.id));
          }
          if (parentFamc) {
            [parentFamc.husb, parentFamc.wife].forEach(gpId => {
              if (gpId) {
                const gpObj = this.store.individus[gpId];
                if (gpObj) inLawGpHtml += createCardHtml(gpObj, '', 'inlaw-node');
              }
            });
          }
        }
      });
    }

    const sectionGrandParents = (gpHtml || inLawGpHtml) ? `
      <div class="tree-generation-row">
        <div class="tree-generation-title">Grands-parents & Beaux-grands-parents</div>
        <div class="tree-row-cards" style="display: flex; flex-wrap: nowrap; min-width: max-content; justify-content: center; gap: 10px;">${gpHtml} ${inLawGpHtml}</div>
      </div>` : '';

    // --- 2. PARENTS & BEAUX-PARENTS ---
    let parentsHtml = '';
    if (famc) {
      const father = famc.husb ? this.store.individus[famc.husb] : null;
      const mother = famc.wife ? this.store.individus[famc.wife] : null;
      let marrInfo = famc.events?.MARR?.date ? `<div style="margin-top:4px; font-style:italic; color:#777;">Mariage : ${famc.events.MARR.date}</div>` : '';
      parentsHtml += createCardHtml(father, marrInfo, 'default');
      parentsHtml += createCardHtml(mother, '', 'default');
    }

    let inLawParentsHtml = '';
    if (famcSpouse) {
      const father = famcSpouse.husb ? this.store.individus[famcSpouse.husb] : null;
      const mother = famcSpouse.wife ? this.store.individus[famcSpouse.wife] : null;
      let marrInfo = famcSpouse.events?.MARR?.date ? `<div style="margin-top:4px; font-style:italic; color:#777;">Mariage : ${famcSpouse.events.MARR.date}</div>` : '';
      inLawParentsHtml += createCardHtml(father, marrInfo, 'inlaw-node');
      inLawParentsHtml += createCardHtml(mother, '', 'inlaw-node');
    }

    const sectionParents = (parentsHtml || inLawParentsHtml) ? `
      <div class="tree-generation-row">
        <div class="tree-generation-title">Parents & Beaux-parents</div>
        <div class="tree-row-cards" style="display: flex; flex-wrap: nowrap; min-width: max-content; justify-content: center; gap: 10px;">${parentsHtml} ${inLawParentsHtml}</div>
      </div>` : '';

    // --- 3. SUJET & CONJOINT ---
    const subjectCard = createCardHtml(activeIndi, '', 'active-node');
    let spouseCardHtml = '';
    if (spouseObj) {
      let unionInfo = marriageDateStr ? `<div style="margin-top:4px; color:#d69e2e; font-weight:bold;">Mariage : ${marriageDateStr}</div>` : '';
      spouseCardHtml = createCardHtml(spouseObj, unionInfo, 'spouse-node');
    }

    const sectionSubject = `
      <div class="tree-generation-row">
        <div class="tree-generation-title">Individu Principal & Conjoint</div>
        <div class="tree-row-cards" style="display: flex !important; flex-direction: row !important; justify-content: center; gap: 15px;">
          ${subjectCard}
          ${spouseCardHtml}
        </div>
      </div>
    `;

    // --- 4. ENFANTS ET PETITS-ENFANTS ---
    let childrenBranchesHtml = '';

    const allChildrenIds = new Set();
    Object.values(this.store.familles).forEach(fam => {
      if ((fam.husb === activeIndi.id || fam.wife === activeIndi.id) && fam.children) {
        fam.children.forEach(cId => allChildrenIds.add(cId));
      }
    });

    allChildrenIds.forEach(cId => {
      const childObj = this.store.individus[cId];
      if (!childObj) return;

      let spousesList = [];
      let childFamIds = new Set();

      Object.values(this.store.familles).forEach(f => {
        if (f.husb === childObj.id || f.wife === childObj.id) {
          childFamIds.add(f.id);
          const spouseId = (f.husb === childObj.id) ? f.wife : f.husb;
          const spouseObj = spouseId ? this.store.individus[spouseId] : null;
          if (spouseObj && !spousesList.some(s => s.obj.id === spouseObj.id)) {
            spousesList.push({
              obj: spouseObj,
              date: f.events?.MARR?.date || ''
            });
          }
        }
      });

      let spouseInfoHtml = '';
      if (spousesList.length > 0) {
        spousesList.forEach(s => {
          const spouseName = `${s.obj.prenom || ''} ${s.obj.nom ? s.obj.nom.toUpperCase() : ''}`.trim();
          const marrTxt = s.date ? ` <small>(${s.date})</small>` : '';
          spouseInfoHtml += `
            <div style="font-size:10px; color:#b91c1c; font-weight:bold; background:#fee2e2; border:1px solid #fca5a5; border-radius:3px; padding:2px 4px; margin-top:4px; text-align:center; display:block;">
              x <a href="#" data-id="${s.obj.id}" class="link-indi" style="color:#b91c1c; text-decoration:none;">${spouseName}</a>${marrTxt}
            </div>`;
        });
      }

      let grandchildrenCards = '';
      childFamIds.forEach(childFamId => {
        const childFam = this.store.familles[childFamId];
        if (childFam && childFam.children) {
          childFam.children.forEach(gcId => {
            const gcObj = this.store.individus[gcId];
            if (gcObj) {
              grandchildrenCards += createCardHtml(gcObj, '', 'grandchild-card');
            }
          });
        }
      });

      let gcSection = grandchildrenCards ? `
        <div class="grandchildren-sublist" style="margin-top: 8px; width: 100%;">
          <div style="font-size:10px; font-weight:bold; color:#718096; margin-bottom:4px; text-align:center;">Petits-enfants :</div>
          ${grandchildrenCards}
        </div>` : '';

      childrenBranchesHtml += `
        <div class="family-branch-group" style="display:flex; flex-direction:column; align-items:center;">
          ${createCardHtml(childObj, spouseInfoHtml, 'default')}
          ${gcSection}
        </div>
      `;
    });

    const sectionChildren = childrenBranchesHtml ? `
      <div class="tree-generation-row">
        <div class="tree-generation-title">Enfants & Descendance</div>
        <div class="tree-row-cards" style="display: flex; flex-wrap: nowrap; min-width: max-content; justify-content: center; gap: 10px;">${childrenBranchesHtml}</div>
      </div>
    ` : '';

    // Rendu global dans le conteneur
    treeContainer.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 14px; color: #333; text-align:center;">Arbre de la lignée</h3>
      ${sectionGrandParents}
      ${sectionParents}
      ${sectionSubject}
      ${sectionChildren}
    `;

    // Attacher les clics sur les liens d'individus dans l'arbre
    treeContainer.querySelectorAll('.link-indi').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const id = link.getAttribute('data-id');
        if (id) {
          this.store.activeIndiId = id;
          this.render();
        }
      };
    });
  }

  render() {
    const listContainer = document.getElementById('indi-list');
    const countElement = document.getElementById('indi-count');
    const noSelectionMsg = document.getElementById('no-selection-message');
    const editorContent = document.getElementById('editor-content');

    if (!listContainer) return;

    const ids = this.sortIndividus(Object.keys(this.store.individus));
    if (countElement) countElement.innerText = `Individus (${ids.length})`;

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    listContainer.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'indi-list';

    ids.forEach(id => {
      const indi = this.store.individus[id];
      const fullName = `${indi.nom.toUpperCase()} ${indi.prenom}`;
      
      const li = document.createElement('li');
      li.innerText = fullName;
      li.setAttribute('data-id', id);
      if (id === this.store.activeIndiId) li.className = 'active';

      if (query) {
        const terms = query.split(' ');
        const matches = terms.every(term => fullName.toLowerCase().includes(term));
        if (!matches) li.style.display = 'none';
      }

      li.onclick = () => {
        this.store.activeIndiId = id;
        this.render();
      };
      ul.appendChild(li);
    });
    listContainer.appendChild(ul);

    const activeIndi = this.store.individus[this.store.activeIndiId];
    if (!activeIndi) {
      if (noSelectionMsg) noSelectionMsg.style.display = 'block';
      if (editorContent) editorContent.classList.add('hidden');
      return;
    }

    if (noSelectionMsg) noSelectionMsg.style.display = 'none';
    if (editorContent) editorContent.classList.remove('hidden');

    document.getElementById('indi-nom').value = activeIndi.nom || '';
    document.getElementById('indi-prenom').value = activeIndi.prenom || '';
    document.getElementById('indi-sexe').value = activeIndi.sexe || 'U';

    const birt = activeIndi.events.BIRT || {};
    document.getElementById('indi-birth-date').value = birt.date || '';
    document.getElementById('indi-birth-place').value = birt.place || '';

    const deat = activeIndi.events.DEAT || {};
    document.getElementById('indi-death-date').value = deat.date || '';
    document.getElementById('indi-death-place').value = deat.place || '';

    // --- BOUTON SUPPRIMER INDIVIDU ---
    const btnDeleteIndi = document.getElementById('btn-delete-indi');
    if (btnDeleteIndi) {
      btnDeleteIndi.onclick = () => {
        const confirmName = `${activeIndi.prenom || ''} ${activeIndi.nom ? activeIndi.nom.toUpperCase() : ''}`.trim();
        if (confirm(`Voulez-vous vraiment supprimer définitivement ${confirmName} ?`)) {
          if (typeof this.store.removeIndividu === 'function') {
            this.store.removeIndividu(activeIndi.id);
          } else if (typeof this.store.deleteIndividu === 'function') {
            this.store.deleteIndividu(activeIndi.id);
          } else {
            delete this.store.individus[activeIndi.id];
            const remaining = Object.keys(this.store.individus);
            this.store.activeIndiId = remaining.length > 0 ? remaining[0] : null;
          }
          this.render();
        }
      };
    }

    let famc = activeIndi.famc ? this.store.familles[activeIndi.famc] : null;
    if (!famc) {
      famc = Object.values(this.store.familles).find(f => f.children && f.children.includes(activeIndi.id));
    }

    const parentsDiv = document.getElementById('parents-list');
    if (parentsDiv) {
      const father = famc && famc.husb ? this.store.individus[famc.husb] : null;
      const mother = famc && famc.wife ? this.store.individus[famc.wife] : null;

      const fatherHTML = father 
        ? `<a href="#" data-id="${father.id}" class="link-indi" style="color:#0066cc; font-weight:bold; text-decoration:none;">${father.nom.toUpperCase()} ${father.prenom}</a>`
        : `<em style="color:#777;">Non renseigné</em>`;

      const motherHTML = mother 
        ? `<a href="#" data-id="${mother.id}" class="link-indi" style="color:#0066cc; font-weight:bold; text-decoration:none;">${mother.nom.toUpperCase()} ${mother.prenom}</a>`
        : `<em style="color:#777;">Non renseignée</em>`;

      parentsDiv.innerHTML = `
        <div style="display:flex; gap:30px; align-items:center;">
          <div><strong>Père :</strong> ${fatherHTML}</div>
          <div><strong>Mère :</strong> ${motherHTML}</div>
        </div>
      `;
    }

    const siblingsDiv = document.getElementById('siblings-list');
    if (siblingsDiv) {
      siblingsDiv.innerHTML = '';
      if (!famc || !famc.children) {
        siblingsDiv.innerHTML = '<em style="color:#777;">Aucun frère ou sœur renseigné</em>';
      } else {
        const siblingIds = famc.children.filter(cId => cId !== activeIndi.id);
        if (siblingIds.length === 0) {
          siblingsDiv.innerHTML = '<em style="color:#777;">Aucun frère ou sœur enregistré</em>';
        } else {
          const ulSiblings = document.createElement('ul');
          ulSiblings.style.cssText = 'margin: 5px 0; padding-left: 20px;';

          siblingIds.forEach(sId => {
            const sibling = this.store.individus[sId];
            if (sibling) {
              const li = document.createElement('li');
              li.style.cssText = 'margin-bottom: 4px;';
              li.innerHTML = `<a href="#" data-id="${sId}" class="link-indi" style="color:#0066cc; text-decoration:none;">${sibling.nom.toUpperCase()} ${sibling.prenom}</a>`;
              ulSiblings.appendChild(li);
            }
          });
          siblingsDiv.appendChild(ulSiblings);
        }
      }
    }

    const unionsDiv = document.getElementById('unions-list');
    if (unionsDiv) {
      unionsDiv.innerHTML = '';
      if (!activeIndi.fams || activeIndi.fams.length === 0) {
        unionsDiv.innerHTML = '<em style="color:#777;">Aucune union enregistrée</em>';
      } else {
        activeIndi.fams.forEach(famId => {
          const fam = this.store.familles[famId];
          if (!fam) return;

          const spouseId = (fam.husb === activeIndi.id) ? fam.wife : fam.husb;
          const spouse = this.store.individus[spouseId];
          const spouseName = spouse ? `${spouse.nom.toUpperCase()} ${spouse.prenom}` : 'Conjoint inconnu';

          const marrDate = fam.events?.MARR?.date || '';
          const marrPlace = fam.events?.MARR?.place || '';
          const unionType = fam.unionType || 'CIVIL';
          
          const divEvent = fam.events?.DIV || {};
          const divType = divEvent.type || 'DIVORCE';
          const divDate = divEvent.date || '';
          const divPlace = divEvent.place || '';
          const isEnded = !!fam.events?.DIV;

          const item = document.createElement('div');
          item.style.cssText = 'padding: 12px; background: #f9f9f9; border-radius: 4px; margin-bottom: 12px; border: 1px solid #ddd;';
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <strong>Conjoint(e) :</strong> ${spouse ? `<a href="#" data-id="${spouseId}" class="link-indi" style="color:#0066cc; text-decoration:none; font-weight:bold;">${spouseName}</a>` : spouseName}
              </div>
              <button type="button" class="btn-delete-union" data-fam="${famId}" style="background:#d9534f; color:white; border:none; border-radius:3px; padding:3px 8px; cursor:pointer; font-size:12px;">Supprimer cette union</button>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:8px;">
              <div style="flex:1;">
                <label style="font-size:12px; color:#555;">Type d'union :</label>
                <select class="union-type-select" data-fam="${famId}" style="width:100%; padding:4px; box-sizing:border-box;">
                  <option value="CIVIL" ${unionType === 'CIVIL' ? 'selected' : ''}>Mariage civil</option>
                  <option value="RELIGIEUX" ${unionType === 'RELIGIEUX' ? 'selected' : ''}>Mariage religieux</option>
                  <option value="PACS" ${unionType === 'PACS' ? 'selected' : ''}>PACS</option>
                  <option value="LIBRE" ${unionType === 'LIBRE' ? 'selected' : ''}>Union libre</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:10px; margin-bottom:8px;">
              <div style="flex:1;">
                <label style="font-size:12px; color:#555;">Date de l'union :</label>
                <input type="text" class="marr-date" data-fam="${famId}" value="${marrDate}" placeholder="ex: 12 OCT 1980" style="width:100%; padding:4px; box-sizing:border-box;">
              </div>
              <div style="flex:1;">
                <label style="font-size:12px; color:#555;">Lieu de l'union :</label>
                <input type="text" class="marr-place" data-fam="${famId}" value="${marrPlace}" placeholder="Lieu" style="width:100%; padding:4px; box-sizing:border-box;">
              </div>
            </div>

            <div style="border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                <label style="font-size:12px; font-weight:bold; color:#444;">Fin d'union (Séparation / Divorce) :</label>
                <label style="font-size:12px; cursor:pointer;"><input type="checkbox" class="toggle-div" data-fam="${famId}" ${isEnded ? 'checked' : ''}> Activer la rupture</label>
              </div>
              
              <div class="div-container" data-fam="${famId}" style="display: ${isEnded ? 'block' : 'none'}; background: #f1f1f1; padding: 8px; border-radius: 4px;">
                <div style="display:flex; gap:10px; margin-bottom:6px;">
                  <div style="flex:1;">
                    <label style="font-size:11px; color:#555;">Motif :</label>
                    <select class="div-type" data-fam="${famId}" style="width:100%; padding:3px; box-sizing:border-box;">
                      <option value="DIVORCE" ${divType === 'DIVORCE' ? 'selected' : ''}>Divorce</option>
                      <option value="SEPARATION" ${divType === 'SEPARATION' ? 'selected' : ''}>Séparation de corps</option>
                      <option value="RUPTURE_PACS" ${divType === 'RUPTURE_PACS' ? 'selected' : ''}>Rupture de PACS</option>
                    </select>
                  </div>
                </div>
                <div style="display:flex; gap:10px;">
                  <div style="flex:1;">
                    <label style="font-size:11px; color:#555;">Date de fin :</label>
                    <input type="text" class="div-date" data-fam="${famId}" value="${divDate}" placeholder="ex: 10 JUN 1995" style="width:100%; padding:3px; box-sizing:border-box;">
                  </div>
                  <div style="flex:1;">
                    <label style="font-size:11px; color:#555;">Lieu de fin :</label>
                    <input type="text" class="div-place" data-fam="${famId}" value="${divPlace}" placeholder="Lieu" style="width:100%; padding:3px; box-sizing:border-box;">
                  </div>
                </div>
              </div>
            </div>
          `;
          unionsDiv.appendChild(item);
        });

        document.querySelectorAll('.btn-delete-union').forEach(btn => {
          btn.onclick = (e) => {
            const fId = e.target.getAttribute('data-fam');
            if (confirm("Voulez-vous vraiment supprimer cette union ?")) {
              this.store.removeUnion(fId);
              this.render();
            }
          };
        });

        document.querySelectorAll('.union-type-select').forEach(select => {
          select.onchange = (e) => {
            this.store.updateUnionType(e.target.getAttribute('data-fam'), e.target.value);
          };
        });

        document.querySelectorAll('.marr-date').forEach(input => {
          input.oninput = (e) => {
            this.store.updateMarriageEvent(e.target.getAttribute('data-fam'), 'date', e.target.value);
          };
        });

        document.querySelectorAll('.marr-place').forEach(input => {
          input.oninput = (e) => {
            this.store.updateMarriageEvent(e.target.getAttribute('data-fam'), 'place', e.target.value);
          };
        });

        document.querySelectorAll('.toggle-div').forEach(chk => {
          chk.onchange = (e) => {
            const fId = e.target.getAttribute('data-fam');
            const fam = this.store.familles[fId];
            if (e.target.checked) {
              if (!fam.events) fam.events = {};
              fam.events.DIV = { type: 'DIVORCE', date: '', place: '' };
            } else {
              if (fam.events) delete fam.events.DIV;
            }
            this.render();
          };
        });

        document.querySelectorAll('.div-type').forEach(select => {
          select.onchange = (e) => {
            this.store.updateUnionEndEvent(e.target.getAttribute('data-fam'), 'type', e.target.value);
          };
        });

        document.querySelectorAll('.div-date').forEach(input => {
          input.oninput = (e) => {
            this.store.updateUnionEndEvent(e.target.getAttribute('data-fam'), 'date', e.target.value);
          };
        });

        document.querySelectorAll('.div-place').forEach(input => {
          input.oninput = (e) => {
            this.store.updateUnionEndEvent(e.target.getAttribute('data-fam'), 'place', e.target.value);
          };
        });
      }
    }

    const btnAddSpouse = document.getElementById('btn-add-spouse');
    if (btnAddSpouse) {
      btnAddSpouse.onclick = () => this.openSpouseModal();
    }

    const childrenDiv = document.getElementById('children-list');
    if (childrenDiv) {
      childrenDiv.innerHTML = '';
      const childrenSet = new Set();

      (activeIndi.fams || []).forEach(famId => {
        const fam = this.store.familles[famId];
        if (fam && fam.children) {
          fam.children.forEach(cId => childrenSet.add(cId));
        }
      });

      if (childrenSet.size === 0) {
        childrenDiv.innerHTML = '<em style="color:#777;">Aucun enfant renseigné</em>';
      } else {
        const ulChildren = document.createElement('ul');
        ulChildren.style.cssText = 'margin: 5px 0; padding-left: 20px;';

        childrenSet.forEach(cId => {
          const child = this.store.individus[cId];
          if (child) {
            const li = document.createElement('li');
            li.style.cssText = 'margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;';
            li.innerHTML = `
              <a href="#" data-id="${cId}" class="link-indi" style="color:#0066cc; text-decoration:none;">${child.nom.toUpperCase()} ${child.prenom}</a>
              <button type="button" class="btn-detach-child" data-id="${cId}" style="background:none; border:none; color:#d9534f; cursor:pointer; font-size:12px; margin-left:10px;">Détacher</button>
            `;
            ulChildren.appendChild(li);
          }
        });
        childrenDiv.appendChild(ulChildren);

        document.querySelectorAll('.btn-detach-child').forEach(btn => {
          btn.onclick = (e) => {
            const cId = e.target.getAttribute('data-id');
            if (confirm("Voulez-vous vraiment détacher cet enfant de la famille ?")) {
              this.detachChildFromActiveFamily(cId);
              this.render();
            }
          };
        });
      }
    }

    const btnAddChild = document.getElementById('btn-add-child');
    if (btnAddChild) {
      btnAddChild.onclick = () => this.openChildModal();
    }

    // Gestionnaires de liens inter-individus
    document.querySelectorAll('.link-indi').forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const id = link.getAttribute('data-id');
        if (id) {
          this.store.activeIndiId = id;
          this.render();
        }
      };
    });

    // Appel du rendu de l'arbre généalogique
    this.renderGenealogyTree(activeIndi, editorContent);
  }
}
