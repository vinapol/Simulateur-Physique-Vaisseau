# Fiche technique — DSTV-80

**Deep Space Transit Vessel**  
Station-vaisseau réutilisable à propulsion nucléaire thermique et gravité artificielle par centrifugeuse haubanée.

| | |
|---|---|
| **Désignation** | DSTV-80 |
| **Type** | Vaisseau habité interplanétaire, infrastructure orbitale permanente |
| **Missions types** | Transits Terre–Mars, Terre–Lune (L₁ / L₂), exploration du système solaire interne |
| **Échelle du modèle 3D** | 1 unité Three.js = 1 mètre · avant = +Z · tuyère = −Z |

---

## Sommaire

1. [Caractéristiques générales](#1-caractéristiques-générales--dimensions)
2. [Gravité artificielle](#2-sous-système-gravité-artificielle--centrifugeuse)
3. [Propulsion et énergie](#3-sous-système-propulsion--énergie)
4. [Radioprotection](#4-radioprotection--sécurité-de-léquipage)
5. [Architecture modulaire](#5-architecture-modulaire--interfaces)
6. [Performances de vol](#6-performances-de-vol-scénario-mars)
7. [Modèle 3D (implémentation)](#7-modèle-3d--description-technique-logicielle)

---

## 1. Caractéristiques générales & dimensions

| Paramètre | Valeur nominale | Remarques |
|---|---|---|
| Longueur hors-tout | **120 m** | De l’anneau d’amarrage avant à la tuyère |
| Diamètre de l’anneau centrifuge | **80 m** (R = 40 m) | Hors haubans |
| Masse sèche (à vide) | **≈ 160 t** | Modules, treillis, réacteur, blindage |
| Masse d’ergols nominale (LH₂) | **200 à 240 t** | 4 réservoirs sous vide, isolation MLI |
| Masse totale au départ (IMLEO) | **380 à 420 t** | Assemblage en 6 à 8 tirs super-lourds |
| Capacité d’équipage | **8 à 12 astronautes** | Volume pressurisé total ≈ 650 m³ |
| Durée de vie opérationnelle | **25 à 30 ans** | Infrastructure orbitale permanente |

---

## 2. Sous-système gravité artificielle & centrifugeuse

L’anneau tourne autour de la poutre centrale **fixe**. L’accélération centrifuge au plancher des modules est :

$$a_c = \omega^2 R$$

Au régime nominal $\omega = 0{,}50\,\mathrm{rad/s}$ et $R = 40\,\mathrm{m}$ :

$$a_c = 0{,}25 \times 40 = 10{,}0\,\mathrm{m/s^2} \approx 1{,}02\,g$$

| Paramètre | Valeur nominale | Impact |
|---|---|---|
| Vitesse angulaire \(\omega\) | **0,50 rad/s** (4,77 tr/min) | Sous le seuil vestibulaire usuel de 5 RPM |
| Accélération au plancher \(a_c\) | **10,0 m/s²** (1,02 g) | Pesanteur terrestre au niveau des pieds |
| Gradient tête–pieds \(\Delta g / g\) | **4,87 %** (stature 1,95 m) | \(1{,}95 / 40\) — imperceptible au quotidien |
| Vitesse linéaire périphérique \(v\) | **20 m/s** (72 km/h) | \(v = \omega R\) — tension de câble modérée |
| Palier rotatif | **Palier magnétique actif (AMB)** | Zéro contact mécanique |
| Transfert puissance / données | Coupleurs inductifs + slip rings optiques | Pas de frottement ni d’usure de balais |
| Matériau du haubanage | Torons Zylon / fibre de carbone | Facteur de sécurité mécanique > 4,5 |
| Architecture des câbles | **Haubanage pyramidal 3D** | Reprise des poussées axiales (moteur) sans « effet parachute » |

Les colliers avant / arrière (z = ±20,5 m sur le modèle) tournent **avec** l’anneau : les haubans ne s’enroulent pas sur la poutre. La poussée du réacteur transite par le palier magnétique du moyeu.

---

## 3. Sous-système propulsion & énergie

| Paramètre | Valeur nominale | Spécifications |
|---|---|---|
| Type | **Nucléaire thermique (NTP)** | Fission, cœur graphite / composite HALEU |
| Poussée maximale \(F\) | **110 kN** | Accélération véhicule ≈ 0,25 m/s² à masse nominale |
| Impulsion spécifique \(I_{sp}\) | **900 à 925 s** | Environ le double d’un étage cryogénique chimique |
| Fluide propulsif | **Hydrogène liquide (LH₂)** | Stocké à −253 °C (20 K) |
| Gestion cryogénique | **Zero Boil-Off (ZBO)** | Cryo-refroidisseurs Stirling / Brayton |
| Puissance électrique de bord | **250 kWe** continus | Génératrice Brayton couplée au cœur |
| Dissipation thermique | **4 radiateurs composites en croix** | Surface totale ≈ 320 m², caloducs sodium / eau |

Sur le modèle 3D, la poussée est un paramètre 0–100 % : elle allume le panache plasma bleu-violet de la tuyère (visualisation, pas un calcul balistique).

---

## 4. Radioprotection & sécurité de l’équipage

**Bouclier d’ombre (shadow shield)**  
Disque / cône tronqué multicouche : tungstène (gammas) + hydrure de lithium / bore (neutrons rapides). Masse ≈ **18 t**. Toujours présent à l’arrière du treillis sur le modèle.

**Cône d’ombre (visualisation)**  
Volume semi-transparent affichable / masquable dans l’UI. Il représente l’umbra dans laquelle l’anneau et les habitats restent à l’abri de la ligne de vue directe du cœur.

**Blindage passif**  
Les quatre réservoirs LH₂ (MLI doré) et les réserves d’eau sont placés en couronne autour de l’axe, entre le réacteur et les zones de vie, pour atténuer GCR et SPE.

**Dose résiduelle**  
Moins de **0,15 Sv** sur un aller-retour martien de 18 mois (limite de carrière astronaute typique : 0,6 Sv).

---

## 5. Architecture modulaire & interfaces

Disposition le long de l’axe (proue → poupe) :

```text
[+Z amarrage]  IDSS  →  sas 0 g  →  treillis  →  moyeu AMB + LH₂
               anneau Ø 80 m (plan z = 0)
               colliers / haubans  →  bouclier  →  radiateurs ✕  →  NTP + tuyère  [−Z]
```

| Zone | Longueur / position | Contenu |
|---|---|---|
| **Proue** | 0–15 m (z ≈ +51 à +60 m sur le modèle) | Nœud **IDSS** (Orion, Crew Dragon, Starship HLS) + sas EVA 0 g |
| **Tronc central** | 15–75 m | Poutre treillis carbone–aluminium, réservoirs LH₂ remplaçables |
| **Anneau** | R = 40 m, 8 modules | Coques pressurisées ; sas central ; hublots orientés vers le moyeu |
| **Poupe** | z ≈ −39 à −60 m | Shadow shield, 4 radiateurs en croix, réacteur, tuyère |

Chaque module d’anneau : sas étanche vers le moyeu, compartiments de vie / travail, ancrages rotulés pour les câbles radiaux et les haubans pyramidaux.

---

## 6. Performances de vol (scénario Mars)

| Grandeur | Valeur |
|---|---|
| Δv disponible (pleine charge d’ergols) | **7,8 km/s** |
| Temps de transit Terre → Mars | **100 à 120 jours** (contre 240–270 j en chimique) |
| Condition à l’arrivée | Pas de perte osseuse ni d’atrophie cardiovasculaire notable ; équipage opérationnel à 0,38 g sans longue réadaptation |

---

## 7. Modèle 3D — description technique logicielle

Visualisation interactive **React Three Fiber** (TypeScript) + overlay **Tailwind**. L’onglet *Vaisseau* de l’application *Graphiques Physique* permet de relier \(a_c = \omega^2 R\) à une architecture réelle.

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/components/spacecraft/constants.ts` | Cotes en mètres (poutre 120 m, R = 40 m, ω₀ = 0,50 rad/s) |
| `src/components/spacecraft/ShipParts.tsx` | Géométries : IDSS, sas, treillis, moyeu, LH₂, bouclier, radiateurs, NTP, modules, câbles |
| `src/components/spacecraft/ExplorationShip.tsx` | Assemblage fixe + groupe rotatif (`rotation.z += ω Δt`) |
| `src/components/spacecraft/ShipViewer.tsx` | Canvas, lumières, étoiles, OrbitControls, sliders |

### Correspondance spec ↔ scène

| Élément d’ingénierie | Représentation 3D |
|---|---|
| Poutre 120 m non tournante | Cylindre + longerons + anneaux de treillis, z ∈ [−60, +60] |
| Port IDSS | Tunnel, couronne, 3 pétales, pions d’alignement |
| Sas 0 g | Cylindre pressurisé, hublots, bande EVA |
| Palier magnétique | Stator cuivre fixe + rotor creux (jeu ≈ 0,28 m) |
| 4 réservoirs LH₂ | Sphères MLI or, coutures, alimentations vers le treillis |
| Anneau 8 modules | Cylindres tangentiels, sas vers le centre, hublots intérieurs, corridors toriques |
| Haubanage | Câbles radiaux (moyeu → sas) + pyramides avant/arrière + ceinture périphérique |
| Shadow shield | Cône tronqué tungstène (toujours visible) + umbra semi-transparente (toggle) |
| Radiateurs | 4 panneaux noirs en croix, caloducs clairs |
| NTP | Cœur, 8 tambours de contrôle, tuyère de Laval, panache additif bleu/violet |

### Commandes de la vue

| Contrôle | Plage | Effet |
|---|---|---|
| OrbitControls | — | Orbite, zoom, amortissement |
| Cône de blindage | on / off | Affiche l’umbra anti-radiations |
| Vitesse de rotation | 0 – 1,20 rad/s | ω de l’anneau ; HUD : RPM, \(a_c\), g_eff |
| Poussée moteur | 0 – 100 % | Intensité du panache et lueur du réacteur |

Régime par défaut : **4,77 RPM · 0,50 rad/s · ≈ 1,02 g** au plancher (R = 40 m).
