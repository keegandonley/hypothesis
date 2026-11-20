# sample datasets

Real-world datasets served as JSON for prototypes, demos, tests, and anything else that needs believable data without a backend. There's no key and no sign-up, and any origin can read them.

```
https://hypothesis.sh/datasets
https://hypothesis.sh/datasets/periodic_table
https://hypothesis.sh/datasets/periodic_table/26
https://hypothesis.sh/datasets/periodic_table/fe
```

## Endpoints

| Path                     | Returns                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `/datasets`              | Every dataset: name, title, record count, license, source  |
| `/datasets/{name}`       | One dataset: license, metadata, field definitions, records |
| `/datasets/{name}/{key}` | One record under `data`, with the dataset's license        |

Anything else returns a `404` with a JSON `error` and a list of the dataset URLs that do exist.

## License

The datasets are published by hypothesis.sh under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You can use them for anything, commercial use included, as long as you credit hypothesis.sh.

Every successful response body includes `license`, placed before `data`. A client that only reads the body still gets the terms, including agents that never look at headers. The license comes with an `attribution` line you can paste as-is:

```json
"license": {
  "name": "CC BY 4.0",
  "url": "https://creativecommons.org/licenses/by/4.0/",
  "attribution": "Periodic table of elements by hypothesis.sh (https://hypothesis.sh/datasets/periodic_table), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)."
}
```

If you ship something built on a dataset (an app, a page, a generated file), put its `attribution` text where the data appears or in your credits. Responses also carry a `Link: <…>; rel="license"` header pointing to the license.

## Response shape

A dataset response looks like this, with `data` holding the records:

```json
{
  "name": "periodic_table",
  "title": "Periodic table of elements",
  "count": 118,
  "license": { "name": "CC BY 4.0", "url": "…", "attribution": "…" },
  "source": {
    "name": "Wikidata",
    "url": "https://www.wikidata.org",
    "license": "CC0 1.0",
    "retrieved_at": "…"
  },
  "primary_key": "atomic_number",
  "fields": [
    {
      "name": "atomic_number",
      "type": "integer",
      "nullable": false,
      "unit": null,
      "description": "…"
    }
  ],
  "notes": ["…"],
  "data": [{ "atomic_number": 1, "symbol": "H", "name": "Hydrogen", "…": "…" }]
}
```

A single record comes in the same wrapper, with the record itself under `data`:

```json
{
  "dataset": "periodic_table",
  "url": "/datasets/periodic_table/fe",
  "license": { "name": "CC BY 4.0", "url": "…", "attribution": "…" },
  "source": { "…": "…" },
  "data": { "atomic_number": 26, "symbol": "Fe", "name": "Iron", "…": "…" }
}
```

`fields` describes every key in a record, in order: its type (`integer`, `number`, `string`, `boolean`, `string[]`, or `integer[]`), whether it can be `null`, and its unit. A missing value is always `null`, never an empty string or `0`, and every record carries every key. `notes` explains how values were chosen.

`source` records where the data came from. It's provenance only; the license that applies is the one in `license`.

## periodic_table

All 118 elements, 32 fields each:

- **Identity and layout**: number, symbol, name, period, group, block, and position in the 18-column table
- **Chemistry**: atomic weight, electron configuration, oxidation states, electronegativity, first ionization energy, radii
- **Physical properties**: standard state, crystal system, melting and boiling points, density, specific heat, thermal and electrical conductivity, speed of sound, Mohs hardness
- **History**: discovery year and discoverers
- **Identifiers**: CAS, PubChem, EC, Wikidata

Look up a single element by atomic number, symbol, or name, ignoring case. Names use IUPAC spelling (Aluminium, Caesium, Sulfur), but `aluminum`, `cesium`, and `sulphur` also work.

```
/datasets/periodic_table/26
/datasets/periodic_table/fe
/datasets/periodic_table/iron
/datasets/periodic_table/aluminum
```

Units: temperatures in kelvin, density in kg/m³ (the same as g/L), energies in eV, radii in picometres. Each field's `unit` says which. To draw the table, use `grid_row` and `grid_column`, which follow the IUPAC 2021 layout: Lu and Lr in group 3, with La–Yb and Ac–No on rows 9 and 10 below an empty row 8.

### Where the data comes from

The records are built from [Wikidata](https://www.wikidata.org), whose data is released under CC0. That puts no conditions on reuse, which is why hypothesis.sh can publish the result under its own license. Wikidata is community-edited, so every value goes through these checks before it's served:

- **Derived, not looked up.** Period, group, block, and grid position are computed from the atomic number.
- **Normalized.** Wikidata stores temperatures in K, °C, and °F. Every value is converted to one unit. Electron configurations come in several notations; they're rewritten in one canonical form, and all forms must agree with each other and have exactly as many electrons as the atomic number.
- **Majority wins.** When Wikidata has several values for a property, a value Wikidata marks as preferred wins. Otherwise the value most entries agree on (within 1%) wins, so a typo in one copy gets outvoted by the correct ones. If there's no majority, the field is `null`.
- **Measured, not computed.** Values computed by density functional theory are excluded. Wikidata's elastic moduli were all computed, so they aren't included at all.
- **Plausibility bounds.** Physically impossible values are dropped, such as an ionization energy of 8914 eV, or a specific heat entered in the wrong unit.
- **Cross-checked.** Melting points, boiling points, densities, electronegativities, and ionization energies are compared with an independent reference (PubChem). Values that differ beyond a set tolerance are excluded. The reference only judges values and never supplies them.

The upshot: **a value that's present has passed every check, and a value that's uncertain is `null` rather than a guess.** That trades coverage for trust. Density and specific heat are present for about 45 elements, and boiling point for about 80.

### Known limitations

- Values for superheavy elements are mostly predictions, and many are `null`.
- Atomic and covalent radii depend on how they're defined. Wikidata doesn't record which definition each value uses, and where its values conflict, the field is `null`.
- Specific heat, thermal and electrical conductivity, speed of sound, and Mohs hardness have no independent reference, so only the majority and plausibility rules check them.

## fit_activities

Four real activity recordings in Garmin's FIT format, served exactly as recorded:

| File                                       | Activity               |
| ------------------------------------------ | ---------------------- |
| `fort-worth-trek-100-texas-2025-09-20.fit` | Road ride, Garmin Edge |
| `friday-ski-2026-01-16.fit`                | Alpine skiing          |
| `halfway-house-morses-mill-2026-06-21.fit` | Hike                   |
| `old-west-austin-deep-eddy-2026-05-03.fit` | Run                    |

`/datasets/fit_activities` lists them with the license, and each file downloads from its `file_url`:

```
https://hypothesis.sh/datasets/fit_activities
https://hypothesis.sh/datasets/fit_activities/friday-ski-2026-01-16.fit
```

Downloads are `application/octet-stream` (FIT has no registered media type). They're readable from any origin and carry the license in a `Link: <…>; rel="license"` header.

## space_images

Seven generated sci-fi images of ships and stations in orbit, each a 1672×941 PNG:

| File                      | What it shows                                   |
| ------------------------- | ----------------------------------------------- |
| `gas-giant-warship.png`   | Warship in front of a ringed orange gas giant   |
| `night-side-liner.png`    | White liner over a planet's night side          |
| `hurricane-freighter.png` | Container freighter over an ocean of hurricanes |
| `mars-refinery-ship.png`  | Copper refinery ship over red canyons           |
| `ring-station.png`        | Ring-shaped station beside a dark planet        |
| `moon-fleet.png`          | Fleet of warships near a cratered moon          |
| `ice-world-station.png`   | Cross-shaped station over a frozen planet       |

`/datasets/space_images` lists them with the license, and each image loads from its `file_url`:

```
https://hypothesis.sh/datasets/space_images
https://hypothesis.sh/datasets/space_images/moon-fleet.png
```

Images are served inline as `image/png`. They're readable from any origin and carry the license in a `Link: <…>; rel="license"` header.

## nature_images

Six generated nature landscapes, each a 1536×1024 PNG:

| File                         | What it shows                          |
| ---------------------------- | -------------------------------------- |
| `glacier-lagoon.png`         | Blue icebergs in front of a glacier    |
| `desert-dunes-sunset.png`    | Sand dunes with shrubs at sunset       |
| `autumn-river-valley.png`    | River through an autumn forest valley  |
| `sea-cliff-waves.png`        | Waves breaking below grassy sea cliffs |
| `alpine-lake-reflection.png` | Snowy peaks reflected in a clear lake  |
| `redwood-forest-trail.png`   | Trail through a misty redwood forest   |

`/datasets/nature_images` lists them with the license, and each image loads from its `file_url`:

```
https://hypothesis.sh/datasets/nature_images
https://hypothesis.sh/datasets/nature_images/glacier-lagoon.png
```

Images are served the same way as `space_images`: inline as `image/png`, readable from any origin, with the license in a `Link` header.

## Caching and CORS

Every response sends `Access-Control-Allow-Origin: *`, so `fetch()` works from any page. Datasets only change with a deploy, so responses are cached at the CDN for a day and in browsers for an hour.

```js
const res = await fetch("https://hypothesis.sh/datasets/periodic_table");
const { data, license } = await res.json();
console.log(license.attribution); // show this wherever the data appears
const gases = data.filter((e) => e.standard_state === "gas");
```
