# Graphiques Physique

Application web pour visualiser des mouvements de mécanique classique, plus un vaisseau interplanétaire à gravité artificielle.

Quatre vues, accessibles depuis la barre de navigation :

| Onglet | Ce qu’on voit |
|---|---|
| **Parabolique** | Trajectoire d’un projectile \(x(t)\), \(y(t)\) |
| **Circulaire** | Rotation dans le plan, \(\omega\) éventuellement accéléré |
| **Rectiligne** | Position \(x(t)\) à accélération constante |
| **Vaisseau** | Anneau centrifuge DSTV-80 en 3D (\(a_c = \omega^2 R\)) |

Les paramètres se règlent à gauche. Les graphiques 2D se relisent en temps réel (lecture, pause, vitesse, curseur).

## Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus
- npm (fourni avec Node)

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l’URL affichée par Vite (en général `http://localhost:5173`).

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Compilation TypeScript + bundle de production |
| `npm run preview` | Servir le build localement |
| `npm run lint` | Oxlint |

## Mouvements 2D

Les équations sont dans `src/physics/`. Les courbes sont dessinées en SVG.

### Parabolique

Paramètres : \(v_{x0}\), \(v_{y0}\), \(y_0\), \(g\).

\[
x(t) = v_{x0}\, t \qquad
y(t) = y_0 + v_{y0}\, t - \tfrac12 g t^2
\]

Stats affichées : portée, hauteur max, temps de vol, \(V_0\) et \(\theta\).

### Circulaire

Paramètres : rayon \(R\), \(\omega_0\), accélération angulaire \(\alpha\), \(\theta_0\), durée.

\[
\omega(t) = \omega_0 + \alpha t \qquad
\theta(t) = \theta_0 + \omega_0 t + \tfrac12 \alpha t^2
\]

Stats : \(\omega\) final, nombre de tours, vitesse linéaire, \(a_c = \omega^2 R\).

### Rectiligne

Paramètres : \(x_0\), \(v_0\), \(a\), durée.

\[
v(t) = v_0 + a t \qquad
x(t) = x_0 + v_0 t + \tfrac12 a t^2
\]

## Vaisseau DSTV-80

Vue 3D (React Three Fiber). Échelle : **1 unité Three.js = 1 m**. Avant = \(+Z\), tuyère = \(-Z\). L’anneau (Ø 80 m) tourne autour de la poutre fixe (120 m).

Au régime nominal \(\omega = 0{,}50\,\mathrm{rad/s}\) (4,77 tr/min) et \(R = 40\,\mathrm{m}\) :

\[
a_c = \omega^2 R \approx 1{,}02\,g
\]

Dans la vue :

- **Clic-glisser** : orbiter autour du vaisseau, **molette** : zoom
- **Cabine FPV** : intérieur de l’ascenseur 1 g ↔ 0 g (clic pour regarder, Échap pour libérer)
- **Module 1 g** : marcher dans l’habitat (ZQSD / WASD)
- **Commandes** : cône anti-radiations, aller-retour de l’ascenseur, rotation, poussée NTP

La fiche d’ingénierie (cotes, NTP, radioprotection, mapping 3D) est dans **[Fiche technique DSTV-80](./gemini-code-1786923661213.md)**.

## Structure

```
src/
  physics/                 équations (projectile, circulaire, rectiligne)
  hooks/                   lecture temporelle des graphiques
  components/              SVG 2D + contrôles
  components/spacecraft/   modèle 3D DSTV-80 (chargé en lazy)
  App.tsx                  navigation et sliders
```

Stack : React 19, Vite 8, TypeScript, Three.js, Tailwind v4 (sans preflight, le CSS existant est conservé).
