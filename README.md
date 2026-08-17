# 🚀 Simulateur de Physique & Vaisseau Interplanétaire DSTV-80
### 🌐 Physics & Interplanetary Spacecraft Simulator (DSTV-80)

<p align="center">
  <a href="#-français"><b>🇫🇷 Français</b></a> •
  <a href="#-english"><b>🇬🇧 English</b></a>
</p>

---

<a id="-français"></a>
# 🇫🇷 Français

Bienvenue dans le **Simulateur de Physique & Vaisseau Spatiale DSTV-80**. Cette application web 3D interactive combine la visualisation de mouvements de mécanique classique 2D avec un modèle d'ingénierie et de trajectoires orbitales 3D pour l'exploration de Mars.

## 🌟 Fonctionnalités Principales

1. **4 Modes de Simulation Interactive** :
   - 🎯 **Tir Parabolique** : Modélisation analytique du mouvement d'un projectile sous pesanteur uniforme.
   - 🌀 **Mouvement Circulaire** : Cinématique angulaire et simulation de la gravité artificielle dans l'anneau centrifuge.
   - 📏 **Mouvement Rectiligne** : Équations de position et de vitesse pour un Mouvement Rectiligne Uniformément Accéléré (MRUA).
   - 🛸 **Vaisseau DSTV-80 & Trajectoire 3D** : Visualisation 3D (React Three Fiber), télémétrie en temps réel, assemblage modulaire et mécanique céleste Terre–Mars.
2. **Système de Traduction Dynamique (i18n)** :
   - Basculement instantané 🇫🇷 FR / 🇬🇧 EN via le sélecteur d'en-tête.
3. **Plan d'Ingénierie & Export SVG/PNG** :
   - Génération dynamique de plans d'élévation longitudinales et coupes transversales vectorielles.
4. **Physique Orbitale Déterministe (Dossier ODT / TXT)** :
   - Calcul exact des 4 manœuvres de transfert de Hohmann ($\Delta v_{\text{total}} = 6{,}80\text{ km/s}$).

---

## 🧮 Équations Physiques (LaTeX)

### 1. Tir Parabolique
Les équations cartésiennes du mouvement avec $v_{x0} = v_0 \cos(\theta)$ et $v_{y0} = v_0 \sin(\theta)$ :

$$x(t) = v_{x0} \cdot t$$

$$y(t) = y_0 + v_{y0} \cdot t - \frac{1}{2} g t^2$$

Apogée et portée théoriques :

$$y_{\text{max}} = y_0 + \frac{v_{y0}^2}{2g} \qquad X_{\text{portée}} = v_{x0} \cdot \left( \frac{v_{y0} + \sqrt{v_{y0}^2 + 2g y_0}}{g} \right)$$

### 2. Mouvement Circulaire & Gravité Artificielle
Accélération angulaire $\alpha$ et accélération centripète au niveau de la jante ($R = 40\text{ m}$) :

$$\omega(t) = \omega_0 + \alpha \cdot t \qquad \theta(t) = \theta_0 + \omega_0 t + \frac{1}{2} \alpha t^2$$

$$a_c = \omega^2 R \qquad g_{\text{anneau}} = \frac{a_c}{g_0}$$

Au régime nominal ($\omega = 0{,}50\text{ rad/s}$, $4{,}77\text{ tr/min}$) : $a_c \approx 1{,}02\,g$.

### 3. Mouvement Rectiligne (MRUA)
$$v(t) = v_0 + a \cdot t \qquad x(t) = x_0 + v_0 t + \frac{1}{2} a t^2$$

### 4. Transfert Orbital & Équation de Tsiolkovsky
Équation fondamentale de la fusée :

$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$

Équation de Vis-Viva pour l'orbite de transfert d'Hohmann (Soleil $\mu_{\odot}$) :

$$v^2 = \mu_{\odot} \left( \frac{2}{r} - \frac{1}{a_{\text{Hohmann}}} \right) \qquad \text{avec } a_{\text{Hohmann}} = \frac{r_{\text{Terre}} + r_{\text{Mars}}}{2}$$

Budget de $\Delta v$ aller-retour (4 manœuvres HEO / EML-1) :

$$\Delta v_{\text{total}} = \Delta v_{\text{TMI}} + \Delta v_{\text{capture\_Mars}} + \Delta v_{\text{TEI}} + \Delta v_{\text{capture\_Terre}} = 3{,}6 + 1{,}1 + 1{,}1 + 1{,}0 = 6{,}80 \text{ km/s}$$

---

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite 8, TypeScript.
- **Rendu 3D** : Three.js / React Three Fiber / Drei.
- **Styling & UI** : Vanilla CSS + TailwindCSS (v4), Glassmorphism UI.
- **Documentation & Exports** : Support LaTeX (KaTeX), exports SVG/PNG vectoriels natifs et génération automatique de rapports OpenDocument (`.odt`).

---

## 📦 Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) v20 ou supérieur
- npm (fourni avec Node)

### Commandes
```bash
# 1. Cloner le projet et installer les dépendances
npm install

# 2. Lancer le serveur de développement local
npm run dev

# 3. Compiler pour la production
npm run build
```

---

<br />

---

<a id="-english"></a>
# 🇬🇧 English

Welcome to the **DSTV-80 Physics & Interplanetary Spacecraft Simulator**. This interactive web application combines classic 2D kinematics simulation with an advanced 3D orbital trajectory and modular spacecraft engineering suite for Earth–Mars exploration missions.

## 🌟 Key Features

1. **4 Interactive Simulation Modes**:
   - 🎯 **Parabolic Launch**: Analytical 2D trajectory of a projectile under uniform gravity.
   - 🌀 **Circular Motion**: Angular kinematics and artificial gravity simulation inside the 40m rotating centrifuge ring.
   - 📏 **Rectilinear Motion**: Position and velocity equations for Uniformly Accelerated Rectilinear Motion.
   - 🛸 **DSTV-80 Spacecraft & 3D Orbit**: 3D interactive view (React Three Fiber), live telemetry HUD, modular slot assembly, and Earth–Mars celestial mechanics.
2. **Dynamic i18n Translation Engine**:
   - Toggle instantly between 🇫🇷 French and 🇬🇧 English via header toggle.
3. **Engineering Blueprints & Vector Export**:
   - Live generation of longitudinal elevation and cross-section vector SVG diagrams.
4. **Deterministic Orbital Physics (ODT / TXT Report)**:
   - Full 4-maneuver Hohmann transfer calculation ($\Delta v_{\text{total}} = 6.80\text{ km/s}$).

---

## 🧮 Physics Equations (LaTeX)

### 1. Parabolic Motion
Cartesian equations of motion with $v_{x0} = v_0 \cos(\theta)$ and $v_{y0} = v_0 \sin(\theta)$:

$$x(t) = v_{x0} \cdot t$$

$$y(t) = y_0 + v_{y0} \cdot t - \frac{1}{2} g t^2$$

Theoretical apex height and horizontal range:

$$y_{\text{max}} = y_0 + \frac{v_{y0}^2}{2g} \qquad X_{\text{range}} = v_{x0} \cdot \left( \frac{v_{y0} + \sqrt{v_{y0}^2 + 2g y_0}}{g} \right)$$

### 2. Circular Motion & Artificial Gravity
Angular acceleration $\alpha$ and centripetal acceleration at ring radius ($R = 40\text{ m}$):

$$\omega(t) = \omega_0 + \alpha \cdot t \qquad \theta(t) = \theta_0 + \omega_0 t + \frac{1}{2} \alpha t^2$$

$$a_c = \omega^2 R \qquad g_{\text{ring}} = \frac{a_c}{g_0}$$

At nominal speed ($\omega = 0.50\text{ rad/s}$, $4.77\text{ rpm}$): $a_c \approx 1.02\,g$.

### 3. Rectilinear Motion
$$v(t) = v_0 + a \cdot t \qquad x(t) = x_0 + v_0 t + \frac{1}{2} a t^2$$

### 4. Orbital Transfer & Tsiolkovsky Rocket Equation
Ideal rocket equation:

$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$

Vis-Viva equation for Keplerian Hohmann transfer orbit ($\text{Sun } \mu_{\odot}$):

$$v^2 = \mu_{\odot} \left( \frac{2}{r} - \frac{1}{a_{\text{Hohmann}}} \right) \qquad \text{where } a_{\text{Hohmann}} = \frac{r_{\text{Earth}} + r_{\text{Mars}}}{2}$$

Total round-trip $\Delta v$ budget (4 maneuvers HEO / EML-1):

$$\Delta v_{\text{total}} = \Delta v_{\text{TMI}} + \Delta v_{\text{capture\_Mars}} + \Delta v_{\text{TEI}} + \Delta v_{\text{capture\_Earth}} = 3.6 + 1.1 + 1.1 + 1.0 = 6.80 \text{ km/s}$$

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript.
- **3D Engine**: Three.js / React Three Fiber / Drei.
- **UI & Styling**: Vanilla CSS + TailwindCSS (v4), Glassmorphism design system.
- **Documentation & Exports**: LaTeX math formatting (KaTeX), vector SVG/PNG exports, and automated OpenDocument (`.odt`) calculation reports.

---

## 📦 Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- npm (bundled with Node)

### Commands
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```
