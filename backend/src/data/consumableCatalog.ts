export type ConsumableSection = 'Surgery OPD' | 'Operation Theatre' | 'Shalya Tantra';

export type ConsumableCatalogItem = {
  section: ConsumableSection;
  category: string;
  item: string;
  unit: string;
  stock: number;
  reorder_level: number;
};

const group = (section: ConsumableSection, category: string, unit: string, items: string[]): ConsumableCatalogItem[] =>
  items.map((item) => ({ section, category, item, unit, stock: 0, reorder_level: 0 }));

const opd = 'Surgery OPD' as const;
const ot = 'Operation Theatre' as const;
const shalya = 'Shalya Tantra' as const;

/**
 * Approved baseline catalog derived from the NIA Surgery OPD and OT consumables
 * brief. Zero stock and zero reorder level intentionally mean "Not Stocked" until
 * a staff member enters the local opening stock and reorder threshold.
 */
export const consumableCatalog: ConsumableCatalogItem[] = [
  ...group(opd, 'General examination & patient care', 'Pair', [
    'Examination gloves — sterile', 'Examination gloves — non-sterile', 'Disposable shoe covers'
  ]),
  ...group(opd, 'General examination & patient care', 'Piece', [
    'Disposable face masks (3-ply)', 'Disposable caps', 'Disposable aprons', 'Disposable bed sheets',
    'Disposable underpads', 'Disposable kidney trays'
  ]),
  ...group(opd, 'General examination & patient care', 'Pack', [
    'Cotton rolls', 'Sterile gauze pieces (10 × 10 cm)', 'Sterile gauze pads', 'Non-sterile gauze',
    'Disposable tissue paper', 'Paper towels'
  ]),
  ...group(opd, 'General examination & patient care', 'Kg', ['Absorbent cotton wool']),
  ...group(opd, 'General examination & patient care', 'Roll', [
    'Roller bandages (5, 7.5, 10, 15 cm)', 'Crepe bandages (6, 8, 10, 15 cm)',
    'Adhesive plaster rolls', 'Micropore surgical tape'
  ]),

  ...group(opd, 'Dressing & wound management', 'Pack', [
    'Sterile dressing pads', 'Absorbent gauze swabs', 'Adhesive wound dressings'
  ]),
  ...group(opd, 'Dressing & wound management', 'Piece', [
    'Paraffin gauze dressing', 'Wound irrigation syringes', 'Disposable plastic forceps'
  ]),
  ...group(opd, 'Dressing & wound management', 'Bottle', [
    'Povidone iodine solution (5% / 10%)', 'Chlorhexidine solution', 'Normal saline (0.9%)',
    'Hydrogen peroxide solution', 'Sterile water', 'Antiseptic hand rub', 'Surgical spirit'
  ]),
  ...group(opd, 'Dressing & wound management', 'Set', ['Disposable dressing sets']),
  ...group(opd, 'Dressing & wound management', 'Roll', [
    'Elastic adhesive bandage', 'Disposable paper tape', 'Zinc oxide adhesive tape'
  ]),

  ...group(opd, 'Minor procedures & OPD interventions', 'Piece', [
    'Sterile surgical blade — No. 10', 'Sterile surgical blade — No. 11', 'Sterile surgical blade — No. 15',
    'Disposable syringe — 2 ml', 'Disposable syringe — 5 ml', 'Disposable syringe — 10 ml',
    'Disposable syringe — 20 ml', 'Disposable needle — 18G, 21G, 23G, 24G, 26G', 'Insulin syringe',
    'Sterile surgical drape', 'Disposable sterile gloves', 'Sterile specimen container',
    'Disposable suction tubing'
  ]),
  ...group(opd, 'Minor procedures & OPD interventions', 'Vial', [
    'Lignocaine 1%', 'Lignocaine 2%', 'Lignocaine with adrenaline'
  ]),
  ...group(opd, 'Minor procedures & OPD interventions', 'Packet', [
    'Suture material — absorbable', 'Suture material — non-absorbable'
  ]),
  ...group(opd, 'Minor procedures & OPD interventions', 'Pack', [
    'Haemostatic gauze', 'Local haemostatic agents'
  ]),

  ...group(opd, 'Procedure-specific consumables', 'Pack', [
    'Rubber ligation bands for haemorrhoids', 'Rectal examination gloves'
  ]),
  ...group(opd, 'Procedure-specific consumables', 'Piece', [
    'Disposable anoscope', 'Disposable proctoscope', 'Fistula probe (disposable)',
    'Disposable punch biopsy instrument', 'Biopsy specimen bottle', 'Disposable cautery electrode',
    'Electrosurgical patient return electrode', 'Disposable suction tip'
  ]),
  ...group(opd, 'Procedure-specific consumables', 'Tube', ['Lubricating jelly']),
  ...group(opd, 'Procedure-specific consumables', 'Bottle', ['Formalin solution for histopathology']),

  ...group(ot, 'PPE & OT preparation', 'Piece', [
    'Disposable surgical caps', 'Disposable face masks', 'N95 masks', 'Sterile surgical gowns',
    'Disposable OT gowns', 'Disposable aprons', 'Eye protection goggles', 'Disposable head covers'
  ]),
  ...group(ot, 'PPE & OT preparation', 'Pair', [
    'Sterile surgical gloves (sizes 6–8)', 'Examination gloves', 'Sterile shoe covers', 'Disposable shoe covers'
  ]),
  ...group(ot, 'PPE & OT preparation', 'Bottle', ['Surgical hand scrub solution', 'Alcohol-based hand rub']),

  ...group(ot, 'Surgical draping & operative-field preparation', 'Piece', [
    'Sterile surgical drapes', 'Disposable abdominal drapes', 'Disposable fenestrated drapes',
    'Sterile OT sheets', 'Sterile instrument covers', 'Mayo stand covers', 'C-arm covers',
    'Microscope covers', 'Laparoscopic camera covers', 'Sterile adhesive incise drapes',
    'Sterile surgical towels', 'Disposable table covers'
  ]),

  ...group(ot, 'Antiseptics, disinfectants & cleaning', 'Bottle', [
    'Povidone iodine scrub', 'Povidone iodine solution', 'Chlorhexidine gluconate solution',
    'Alcohol-based skin antiseptic', '70% isopropyl alcohol', 'Sterile normal saline', 'Sterile distilled water'
  ]),
  ...group(ot, 'Antiseptics, disinfectants & cleaning', 'Litre', [
    'Surface disinfectant', 'Enzymatic instrument-cleaning solution', 'Hypochlorite solution / concentrate'
  ]),
  ...group(ot, 'Antiseptics, disinfectants & cleaning', 'Piece', ['Sterile instrument-cleaning brushes']),
  ...group(ot, 'Antiseptics, disinfectants & cleaning', 'Pack', ['Lint-free cleaning cloths']),

  ...group(ot, 'Surgical consumables & sutures', 'Packet', [
    'Vicryl / polyglactin 910 (0–4-0)', 'Vicryl rapide (2-0–4-0)', 'PDS / polydioxanone (0–3-0)',
    'Monocryl / poliglecaprone (3-0–4-0)', 'Silk (0–4-0)', 'Nylon (2-0–5-0)',
    'Polypropylene / Prolene (0–4-0)', 'Chromic catgut (0–2-0)', 'Plain catgut (2-0–3-0)',
    'Stainless steel suture wire', 'Ligature materials'
  ]),
  ...group(ot, 'Surgical consumables & sutures', 'Piece', [
    'Sterile surgical blade — Nos. 10, 11, 12, 15, 20, 21, 22', 'Skin stapler', 'Staple remover',
    'Surgical adhesive', 'Bone wax', 'Surgical marking pen', 'Skin preparation applicator'
  ]),
  ...group(ot, 'Surgical consumables & sutures', 'Pack', [
    'Haemostatic agents', 'Sterile gauze swabs', 'Abdominal mops', 'Laparotomy pads', 'Cottonoids'
  ]),

  ...group(ot, 'Anaesthesia & airway management', 'Piece', [
    'Endotracheal tubes — cuffed and uncuffed', 'Laryngeal mask airway (LMA)', 'HME filter',
    'Bacterial / viral filter', 'Disposable face mask for ventilation', 'Guedel airway',
    'Nasopharyngeal airway', 'Suction catheter', 'Yankauer suction tip', 'Disposable suction tubing',
    'Spinal anaesthesia needle — 22G, 25G, 26G, 27G', 'Epidural needle', 'Epidural catheter',
    'Peripheral IV cannula — 14G to 24G', 'Three-way stopcock', 'Extension line',
    'Disposable syringe — 2, 5, 10, 20, 50 ml', 'Injection needle', 'Oxygen mask',
    'Nebulization mask', 'CO₂ sampling line', 'Temperature probe', 'Urine collection bag'
  ]),
  ...group(ot, 'Anaesthesia & airway management', 'Set', [
    'Disposable breathing circuit', 'Bain breathing circuit', 'IV infusion set', 'Blood transfusion set'
  ]),
  ...group(ot, 'Anaesthesia & airway management', 'Pack', ['ECG electrodes', 'Glucose test strips']),
  ...group(ot, 'Anaesthesia & airway management', 'Pair', ['Defibrillator pads']),

  ...group(ot, 'Laparoscopic & endoscopic surgery', 'Piece', [
    'Disposable laparoscopic trocar — 5 mm', 'Disposable laparoscopic trocar — 10 mm',
    'Laparoscopic specimen retrieval bag', 'Electrosurgical hook electrode', 'Laparoscopic monopolar cable',
    'Bipolar forceps tip', 'Endoscopic biopsy forceps', 'Polypectomy snare', 'Endoscopic cleaning brush',
    'Endoscopic bite block'
  ]),
  ...group(ot, 'Laparoscopic & endoscopic surgery', 'Set', [
    'Laparoscopic insufflation tubing', 'Laparoscopic suction-irrigation tubing'
  ]),
  ...group(ot, 'Laparoscopic & endoscopic surgery', 'Cartridge', ['Laparoscopic clip cartridge']),
  ...group(ot, 'Laparoscopic & endoscopic surgery', 'Cylinder', ['CO₂ cylinder / refill']),

  ...group(ot, 'Urological & general surgery', 'Piece', [
    "Foley's catheter — 12, 14, 16, 18, 20 Fr", 'Nelaton catheter', 'Urine collection bag', "Ryle's tube",
    'Nasogastric tube', 'Silicone drain', 'Romovac drain', 'Corrugated drain', 'Intercostal drainage tube',
    'Drainage bag', 'Feeding tube', 'Surgical suction drain', 'Foley catheter fixation device'
  ]),
  ...group(ot, 'Urological & general surgery', 'Set', ['Suprapubic catheter set']),

  ...group(ot, 'Sterilization & CSSD', 'Roll', [
    'Autoclave indicator tape', 'Sterilization wrapping material', 'Sterilization labels'
  ]),
  ...group(ot, 'Sterilization & CSSD', 'Pack', [
    'Chemical indicator strips', 'Class 5/6 integrators', 'Biological indicators for steam sterilization',
    'Sterilization pouches — different sizes', 'Non-woven sterilization wraps', 'Instrument tray liners',
    'Bowie-Dick test packs'
  ]),
  ...group(ot, 'Sterilization & CSSD', 'Litre', ['Enzymatic cleaning solution']),
  ...group(ot, 'Sterilization & CSSD', 'Bottle', ['Instrument lubricant']),
  ...group(ot, 'Sterilization & CSSD', 'Pair', ['Sterile gloves for CSSD handling']),

  ...group(ot, 'Postoperative & recovery room', 'Pack', [
    'Sterile wound dressings', 'Gauze pieces'
  ]),
  ...group(ot, 'Postoperative & recovery room', 'Roll', ['Roller bandages', 'Crepe bandages', 'Adhesive tapes']),
  ...group(ot, 'Postoperative & recovery room', 'Piece', [
    'IV cannula', 'IV infusion set', 'Oxygen mask', 'Nasal cannula', 'Suction catheter',
    'Pulse oximeter disposable probe', 'Urine bag', 'Disposable bed sheet', 'Disposable underpad', 'Emesis bag'
  ]),
  ...group(ot, 'Postoperative & recovery room', 'Pack', ['ECG electrodes']),

  ...group(ot, 'Biomedical waste management', 'Pack', [
    'Yellow biomedical waste bags', 'Red biomedical waste bags', 'Colour-coded waste labels'
  ]),
  ...group(ot, 'Biomedical waste management', 'Piece', [
    'White translucent puncture-proof container', 'Blue biomedical waste container',
    'Needle destroyer container', 'Sharps container'
  ]),
  ...group(ot, 'Biomedical waste management', 'Kit', ['Spill management kit']),
  ...group(ot, 'Biomedical waste management', 'Pair', ['Disposable heavy-duty gloves']),
  ...group(ot, 'Biomedical waste management', 'Roll', ['Waste collection liners']),

  ...group(shalya, 'Anorectal surgery', 'Pack', ['Rubber ligation bands', 'Haemostatic agents']),
  ...group(shalya, 'Anorectal surgery', 'Tube', ['Lubricating jelly']),
  ...group(shalya, 'Anorectal surgery', 'Piece', [
    'Disposable anal dilator', 'Fistula seton', 'Fistula probe', 'Paraffin gauze',
    'Disposable proctoscope / anoscope'
  ]),
  ...group(shalya, 'Hydrocele & scrotal surgery', 'Piece', [
    'Sterile surgical blades', 'Sterile gauze and scrotal support dressing', 'Sterile drapes', 'Suction tubing'
  ]),
  ...group(shalya, 'Hydrocele & scrotal surgery', 'Packet', ['Absorbable sutures (2-0, 3-0)', 'Non-absorbable sutures']),
  ...group(shalya, 'Hydrocele & scrotal surgery', 'Vial', ['Lignocaine injection', 'Bupivacaine injection']),
  ...group(shalya, 'Hernia surgery', 'Piece', [
    'Polypropylene mesh — different sizes', 'Skin stapler', 'Drainage tube', 'Electrocautery electrode', 'Sterile drapes'
  ]),
  ...group(shalya, 'Hernia surgery', 'Packet', ['Polypropylene sutures', 'Absorbable sutures']),
  ...group(shalya, 'Wound care & emergency surgery', 'Piece', [
    'Paraffin gauze', 'Hydrocolloid dressing', 'Alginate dressing', 'Foam dressing',
    'Silver-impregnated dressing', 'Negative pressure wound therapy consumable', 'Haemostatic dressing'
  ]),
  ...group(shalya, 'Wound care & emergency surgery', 'Bottle', ['Sterile irrigation solution'])
];
