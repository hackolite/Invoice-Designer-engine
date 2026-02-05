# Row Management Buttons - UI Placement Documentation

## Objectif

Placer les boutons "Add Row" et "Remove Row" près des contrôles de bordure et de largeur dans l'éditeur de templates pour les tables de prix.

## Emplacement dans l'Interface

Les boutons sont maintenant positionnés directement après le contrôle "Grid Border Thickness" (Épaisseur de bordure) et avant la section "Data Source", uniquement pour les tables de type prix.

### Structure Visuelle

```
┌────────────────────────────────────────┐
│  Propriétés de la Table (Prix)         │
├────────────────────────────────────────┤
│                                        │
│  Grid Border Color                     │
│  [🎨] [#000000________________]       │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  Grid Border Thickness                 │
│  [1_______] px                        │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  ✨ Manage Summary Rows                │
│  ┌──────────────┬──────────────┐      │
│  │ ➕ Add Row   │ 🗑️ Remove Row │      │
│  └──────────────┴──────────────┘      │
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  Data Source (Object)                  │
│  [e.g. financialSummary___________]   │
│                                        │
└────────────────────────────────────────┘
```

## Implémentation Technique

### Fichier Modifié
- **Chemin**: `client/src/components/ElementProperties.tsx`
- **Lignes ajoutées**: ~30 lignes

### Méthodes Auxiliaires Créées

```typescript
// Méthode pour supprimer la dernière ligne ajoutée
const removeMostRecentRow = () => {
  const rows = element.tableConfig?.additionalRows;
  if (rows && rows.length > 0) {
    handleTableAdditionalRowRemove(rows.length - 1);
  }
};

// Méthode pour vérifier si on peut supprimer des lignes
const canRemoveRows = () => {
  return element.tableConfig?.additionalRows && 
         element.tableConfig.additionalRows.length > 0;
};
```

### Structure UI

```tsx
{element.tableConfig.tableType === 'price' && (
  <>
    <Separator />
    <div className="space-y-2">
      <Label>Manage Summary Rows</Label>
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleTableAdditionalRowAdd}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={removeMostRecentRow}
          disabled={!canRemoveRows()}
        >
          <Trash2 className="w-3 h-3 mr-1" /> Remove Row
        </Button>
      </div>
    </div>
  </>
)}
```

## Caractéristiques de l'Implémentation

### 1. Affichage Conditionnel
- ✅ Les boutons n'apparaissent **que** pour les tables de type "price"
- ✅ Utilise `element.tableConfig.tableType === 'price'` pour le rendu conditionnel

### 2. Layout Grid
- ✅ Utilise `grid grid-cols-2` pour disposer les boutons côte à côte
- ✅ Gap de 2 unités entre les boutons pour un espacement optimal

### 3. État Désactivé Intelligent  
- ✅ Le bouton "Remove Row" est désactivé quand il n'y a pas de lignes à supprimer
- ✅ Vérifie l'existence et la longueur du tableau `additionalRows`

### 4. Cohérence Visuelle
- ✅ Utilise `variant="outline"` comme les autres boutons du panneau
- ✅ Taille `sm` pour s'intégrer harmonieusement
- ✅ Icônes Lucide React (`Plus` et `Trash2`)

### 5. Séparateurs
- ✅ Séparateurs avant et après la section pour une délimitation claire
- ✅ Fragment React (`<>`) pour grouper le séparateur et le contenu

## Avantages de cette Disposition

✅ **Proximité logique**: Près des contrôles de style (bordure/largeur)
✅ **Découvrabilité**: Dans le flux naturel de configuration de la table
✅ **Accessibilité**: Faciles à trouver et à utiliser
✅ **Cohérence**: Suit le pattern UI du reste de l'éditeur
✅ **Feedback visuel**: État désactivé clair quand non applicable

## Tests Effectués

- [x] Compilation TypeScript sans erreurs
- [x] Build de production réussi
- [x] Pas de régression sur les fonctionnalités existantes
- [x] Utilisation des handlers existants (pas de duplication de code)

## Notes d'Utilisation

### Bouton "Add Row"
- Ajoute une nouvelle ligne de résumé/total à la table de prix
- Toujours actif (peut ajouter autant de lignes que nécessaire)
- Utilise le handler existant `handleTableAdditionalRowAdd`

### Bouton "Remove Row"
- Supprime la dernière ligne ajoutée (ordre LIFO)
- Désactivé automatiquement quand `additionalRows` est vide
- Appelle `removeMostRecentRow()` qui utilise `handleTableAdditionalRowRemove`

## Compatibilité

- ✅ Compatible avec toutes les tables de prix existantes
- ✅ N'affecte pas les autres types de tables (grid, standard)
- ✅ Réutilise les fonctions de gestion existantes
- ✅ Aucun changement breaking dans l'API
