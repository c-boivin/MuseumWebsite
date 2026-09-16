/**
 * Corrections manuelles d'URL d'images cassées dans l'API.
 *
 * POURQUOI CE FICHIER EXISTE : l'API du cours contient des URL Wikimedia qui ne
 * pointent plus sur rien. Le cas général — une largeur de vignette devenue non
 * standard — est réparé automatiquement dans `lib/museum.ts`. Restent les fautes
 * de frappe dans le nom du fichier, qu'aucune règle ne peut deviner : il faut
 * retrouver le bon fichier sur Wikimedia Commons et l'écrire ici.
 *
 * COMMENT EN AJOUTER UNE : si une œuvre s'affiche sans visuel, ouvrir son URL
 * `image` dans le navigateur. Un 404 signifie que le fichier n'existe pas ;
 * chercher alors l'œuvre sur commons.wikimedia.org et coller l'URL de la
 * vignette 1920px ici, en clé l'URL cassée telle que l'API l'envoie.
 *
 * SI LE PROF CORRIGE SA BASE, il n'y a rien d'urgent à faire : une clé qui ne
 * correspond plus à aucune URL ne s'applique simplement jamais. Le fichier
 * devient du poids mort, à vider à l'occasion. C'est un pansement, pas une
 * fonctionnalité — il ne doit jamais grossir au point qu'on l'oublie.
 */
export const imageOverrides: Record<string, string> = {
  /* The Fighting Temeraire — l'API écrit « berth_to_be_broken_up », le fichier
     réel s'appelle « Berth_to_be_broken » (majuscule, et sans le « up »). */
  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Turner%2C_J._M._W._-_The_Fighting_T%C3%A9m%C3%A9raire_tugged_to_her_last_berth_to_be_broken_up.jpg/2560px-Turner%2C_J._M._W._-_The_Fighting_T%C3%A9m%C3%A9raire_tugged_to_her_last_berth_to_be_broken_up.jpg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Turner%2C_J._M._W._-_The_Fighting_T%C3%A9m%C3%A9raire_tugged_to_her_last_Berth_to_be_broken.jpg/1920px-Turner%2C_J._M._W._-_The_Fighting_T%C3%A9m%C3%A9raire_tugged_to_her_last_Berth_to_be_broken.jpg",

  /* The Hay Wain — le nom du fichier est bon, mais l'API se trompe de dossier :
     Wikimedia range ses fichiers dans deux niveaux dérivés d'un hash, et l'API
     annonce « b/b6 » là où le fichier est en « 5/5e ». */
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/John_Constable_-_The_Hay_Wain_%281821%29.jpg/2560px-John_Constable_-_The_Hay_Wain_%281821%29.jpg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/John_Constable_-_The_Hay_Wain_%281821%29.jpg/1920px-John_Constable_-_The_Hay_Wain_%281821%29.jpg",
};
