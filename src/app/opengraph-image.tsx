import { ImageResponse } from "next/og";
import { site } from "@/data/site";

/**
 * Image de partage par défaut du site.
 *
 * Fichier spécial de l'App Router : Next l'exécute au build, enregistre le PNG
 * et ajoute les `<meta property="og:image">`. À la racine de `app/`, il sert de
 * repli à toutes les pages sauf les fiches œuvres, qui déclarent la reproduction
 * de l'œuvre — une toile pour une toile, la carte du musée pour le reste.
 *
 * Une image fabriquée et non un PNG dans `public/` : le nom du musée vit dans
 * `data/site.ts`, et une image exportée d'un outil de dessin resterait fausse
 * après un changement de nom.
 *
 * ⚠️ Police par défaut, et c'est délibéré : le rendu passe par Satori, qui ne
 * sait pas lire les polices de `next/font`. Il faudrait télécharger le fichier
 * au build depuis Google Fonts en forçant un vieux `User-Agent` pour recevoir du
 * TTF — une dépendance réseau fragile au milieu du build, pour une différence de
 * dessin sur une vignette. La composition porte l'identité à la place.
 */
export const alt = `${site.name} — ${site.tagline}`;

/** Format canonique des images Open Graph. Tous les réseaux le recadrent sans casse. */
export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/* Repris de `globals.css`, en dur parce que Satori ne lit pas la feuille de
   style : il ne connaît ni Tailwind ni les variables CSS. */
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
