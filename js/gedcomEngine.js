const gedcomEngine = {
  parse(content, store) {
    store.clear();
    const lines = content.split(/\r?\n/);
    let currentIndi = null;
    let currentFam = null;
    let currentContext = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const parts = line.split(' ');
      const level = parts[0];

      if (level === '0') {
        currentContext = null;
        if (parts[2] === 'INDI') {
          const id = parts[1].replace(/@/g, '').trim();
          currentIndi = { id, nom: '', prenom: '', sexe: 'U', events: {}, fams: [], famc: null };
          store.individus[id] = currentIndi;
          currentFam = null;
        } else if (parts[2] === 'FAM') {
          const id = parts[1].replace(/@/g, '').trim();
          currentFam = { id, husb: null, wife: null, children: [], events: {} };
          store.familles[id] = currentFam;
          currentIndi = null;
        } else {
          currentIndi = null;
          currentFam = null;
        }
        continue;
      }

      // Traitement Individus
      if (currentIndi) {
        if (level === '1') {
          const tag = parts[1];
          const val = parts.slice(2).join(' ').trim();

          if (tag === 'NAME') {
            const matches = val.match(/(.*?)\/(.*?)\//);
            if (matches) {
              currentIndi.prenom = matches[1].replace(/,/g, ' ').trim();
              currentIndi.nom = matches[2].trim();
            } else {
              const partsName = val.split(',');
              if (partsName.length > 1) {
                currentIndi.nom = partsName[0].trim();
                currentIndi.prenom = partsName.slice(1).join(' ').trim();
              } else {
                currentIndi.prenom = val;
              }
            }
          } else if (tag === 'SEX') {
            currentIndi.sexe = val.toUpperCase().charAt(0) || 'U';
          } else if (tag === 'FAMS') {
            currentIndi.fams.push(val.replace(/@/g, '').trim());
          } else if (tag === 'FAMC') {
            currentIndi.famc = val.replace(/@/g, '').trim();
          } else if (tag === 'BIRT' || tag === 'DEAT') {
            currentContext = tag;
            if (!currentIndi.events[tag]) currentIndi.events[tag] = {};
          } else {
            currentContext = null;
          }
        } else if (level === '2' && currentContext) {
          const tag = parts[1];
          const val = parts.slice(2).join(' ').trim();
          if (tag === 'DATE') currentIndi.events[currentContext].date = val;
          if (tag === 'PLAC') currentIndi.events[currentContext].place = val;
        }
      }

      // Traitement Familles
      if (currentFam) {
        if (level === '1') {
          const tag = parts[1];
          const val = parts.slice(2).join(' ').replace(/@/g, '').trim();
          if (tag === 'HUSB') currentFam.husb = val;
          if (tag === 'WIFE') currentFam.wife = val;
          if (tag === 'CHIL') currentFam.children.push(val);
          if (tag === 'MARR') {
            currentContext = 'MARR';
            if (!currentFam.events) currentFam.events = {};
            if (!currentFam.events.MARR) currentFam.events.MARR = {};
          } else {
            currentContext = null;
          }
        } else if (level === '2' && currentContext === 'MARR') {
          const tag = parts[1];
          const val = parts.slice(2).join(' ').trim();
          if (tag === 'DATE') currentFam.events.MARR.date = val;
          if (tag === 'PLAC') currentFam.events.MARR.place = val;
        }
      }
    }
  },

  export(store) {
    let out = [];
    out.push("0 HEAD");
    out.push("1 SOUR GeneaCore");
    out.push("1 GEDC");
    out.push("2 VERS 5.5.1");
    out.push("2 FORM LINEAGE-LINKED");
    out.push("1 CHAR UTF-8");

    // Individus
    Object.values(store.individus).forEach(i => {
      out.push(`0 @${i.id}@ INDI`);
      out.push(`1 NAME ${i.prenom} /${i.nom}/`);
      if (i.sexe) out.push(`1 SEX ${i.sexe}`);

      if (i.events?.BIRT && (i.events.BIRT.date || i.events.BIRT.place)) {
        out.push("1 BIRT");
        if (i.events.BIRT.date) out.push(`2 DATE ${i.events.BIRT.date}`);
        if (i.events.BIRT.place) out.push(`2 PLAC ${i.events.BIRT.place}`);
      }

      if (i.events?.DEAT && (i.events.DEAT.date || i.events.DEAT.place)) {
        out.push("1 DEAT");
        if (i.events.DEAT.date) out.push(`2 DATE ${i.events.DEAT.date}`);
        if (i.events.DEAT.place) out.push(`2 PLAC ${i.events.DEAT.place}`);
      }

      if (i.famc) out.push(`1 FAMC @${i.famc}@`);
      if (i.fams) {
        i.fams.forEach(fId => out.push(`1 FAMS @${fId}@`));
      }
    });

    // Familles
    Object.values(store.familles).forEach(f => {
      out.push(`0 @${f.id}@ FAM`);
      if (f.husb) out.push(`1 HUSB @${f.husb}@`);
      if (f.wife) out.push(`1 WIFE @${f.wife}@`);
      if (f.children) {
        f.children.forEach(cId => out.push(`1 CHIL @${cId}@`));
      }
      if (f.events?.MARR && (f.events.MARR.date || f.events.MARR.place)) {
        out.push("1 MARR");
        if (f.events.MARR.date) out.push(`2 DATE ${f.events.MARR.date}`);
        if (f.events.MARR.place) out.push(`2 PLAC ${f.events.MARR.place}`);
      }
    });

    out.push("0 TRLR");
    return out.join("\n");
  }
};
