import { ImageResponse } from "next/og";
import { site } from "@/data/site";

/**
 * Image de partage par défaut du site — celle qui s'affiche quand un lien est
 * collé dans une conversation ou sur un réseau social.
 *
 * Fichier spécial de l'App Router : Next l'exécute AU BUILD, enregistre le PNG,
 * et ajoute tout seul les `<meta property="og:image">` qui vont avec. Placé à la
 * racine de `app/`, il sert de repli à toutes les pages — sauf les fiches
 * œuvres, dont le `generateMetadata` déclare sa propre image, la reproduction de
 * l'œuvre. C'est le bon partage dans les deux cas : une toile pour une toile,
 * la carte du musée pour tout le reste.
 *
 * POURQUOI UNE IMAGE FABRIQUÉE ET NON UN PNG DANS `public/` : le nom du musée et
 * sa signature vivent dans `data/site.ts`. Une image exportée d'un outil de
 * dessin les figerait dans un fichier binaire, et resterait fausse après un
 * changement de nom — le genre d'écart que personne ne va vérifier.
 *
 * ⚠️ POLICE PAR DÉFAUT, ET C'EST DÉLIBÉRÉ. Le rendu passe par Satori, qui ne
 * sait pas lire les polices chargées par `next/font` : pour obtenir Instrument
 * Serif ici, il faudrait télécharger le fichier de police au build, depuis
 * Google Fonts, en forçant un vieux `User-Agent` pour recevoir du TTF — Satori
 * ne gère pas le WOFF2. Une dépendance réseau fragile au milieu du build, qui
 * tombe derrière un proxy d'entreprise (voir le README), pour une différence de
 * dessin sur une vignette de partage. La composition porte l'identité à la
 * place : format, échelle et couleurs du site.
 */
export const alt = `${site.name} — ${site.tagline}`;

/** Format canonique des images Open Graph. Tous les réseaux le recadrent sans casse. */
export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/* Repris de `globals.css`. Écrits en dur parce que Satori ne lit pas la feuille
   de style du site : il ne connaît ni Tailwind ni les variables CSS. */
const INK = "#141210";
const INK_SOFT = "#56514c";
const PAPER = "#faf9f7";
const ACCENT = "#8a6f4e";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        color: INK,
        padding: "72px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        {`Musée · ${site.address.city}`}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 104, lineHeight: 1.05 }}>
          {site.name}
        </div>
        {/* Le filet du site, à l'échelle de l'image. */}
        <div
          style={{
            display: "flex",
            width: 160,
            height: 2,
            backgroundColor: ACCENT,
            margin: "40px 0",
          }}
        />
        <div style={{ display: "flex", fontSize: 40, color: INK_SOFT }}>
          {site.tagline}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: INK_SOFT,
        }}
      >
        <div style={{ display: "flex" }}>
          {`${site.address.street}, ${site.address.zip} ${site.address.city}`}
        </div>
        <div style={{ display: "flex" }}>{site.openingHours[0].days}</div>
      </div>
    </div>,
    size,
  );
}
