# sample datasets

Real-world datasets served as JSON, for prototypes, demos, tests, and anything else that needs believable data without a backend. No key, no rate-limit sign-up, readable from any origin.

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
| `/datasets/{name}/{key}` | A single record under `data`, with the dataset's license   |

Anything else is a `404` with a JSON `error` and a list of the dataset URLs that do exist.

## License in every response

Every successful response body includes the dataset's `license`, and it always comes before `data`. That means anything reading the response gets the terms along with the data, including agents and clients that never look at headers. Each license comes with an `attribution` line you can paste as-is to give the credit it requires:

```json
"license": {
  "name": "CC BY 4.0",
  "url": "https://creativecommons.org/licenses/by/4.0/",
  "attribution": "\"Properties of the elements\" by Taha Ahmed (https://doi.org/10.6084/m9.figshare.1295585.v1), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified: misaligned values corrected, element names updated, units and formatting cleaned."
}
```

If you ship something built on a dataset (an app, a page, a generated file), include its `attribution` text where the data is shown or in your credits. The same license URL is also in a `Link: <…>; rel="license"` response header.

## Response shape

A dataset response looks like this, with `data` holding the records:

```json
{
  "name": "periodic_table",
  "title": "Periodic table of elements",
  "count": 118,
  "source": {
    "title": "Properties of the elements",
    "author": "Taha Ahmed",
    "url": "…"
  },
  "license": {
    "name": "CC BY 4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/"
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
  "corrections": ["…"],
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

`fields` describes every key in a record, in order: its type (`integer`, `number`, `string`, `boolean`, or `string[]`), whether it can be `null`, and its unit. Missing values are always `null`, never an empty string or `0`, and every record carries every key.

## periodic_table

All 118 elements, 81 fields each: identity and table layout, thermal, mechanical, atomic, electrical and magnetic, crystal structure, abundance, nuclear, safety, and registry identifiers.

Look up a single element by atomic number, symbol, or name, case-insensitive. Alternate names work too, including Latin roots and the placeholder names elements 112–118 had before they were named.

```
/datasets/periodic_table/26
/datasets/periodic_table/fe
/datasets/periodic_table/iron
/datasets/periodic_table/ferrum
```

Values are in SI base units, as the source publishes them: temperatures in kelvin, pressures and hardness in pascals, densities in kg/m³, radii in metres, and half-lives in seconds. A field's `unit` says which. To render the table, `grid_row` and `grid_column` place every element on the conventional 18-column layout. The lanthanides and actinides go on rows 9 and 10, below an empty row 8.

### Source and corrections

The data comes from [Properties of the elements](https://doi.org/10.6084/m9.figshare.1295585.v1) by Taha Ahmed (2015), compiled from Wolfram ElementData and [mirrored on Kaggle](https://www.kaggle.com/datasets/mexwell/periodic-table-of-elements). It is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). If you redistribute it, credit the source; the `attribution` line in every response does that for you.

The source has errors, and these are corrected rather than passed through. The dataset's `corrections` array lists each one:

- **Scrambled columns.** Electron configuration, specific heat, and RTECS number sit on the wrong rows in the source. Helium has Promethium's configuration, and Lithium has Beryllium's specific heat. All three share one row permutation, recovered from the configurations themselves: the electron count of a neutral atom's configuration is its atomic number. Every other column was checked against PubChem and reference values and is aligned.
- **Renamed elements.** Elements 112–118 have their IUPAC names, Copernicium through Oganesson, not Ununbium through Ununoctium.
- **Mohs hardness** is a 1–10 scale. The source stored it multiplied by 10⁶.
- **Melting and boiling points** come from the source's exact Kelvin columns. The other copies had been round-tripped through Celsius (`4.21999999999997`).
- **Formatting.** Space groups read `Fm-3m` instead of an underscore and a line break, and identifiers drop their `CAS`/`CID`/`EU`/… prefixes.

### Known limitations

- Values for superheavy elements are mostly predictions, and many are `null`.
- Half-lives and lifetimes of short-lived elements are uneven. The source's own unit sheet marks a few as minutes, not seconds, without saying which ones. Francium's `21.7`, for example, matches its 22-minute half-life. Don't use these for anything that matters.
- The data is a 2015 snapshot. Atomic weights of synthetic elements give the mass number of the isotope known then.
- `neutron_mass_absorption` has no unit in the source, so its `unit` is `null`.

## Caching and CORS

Every response sends `Access-Control-Allow-Origin: *`, so `fetch()` works from any page. Datasets only change with a deploy, so responses are cached at the CDN for a day and in browsers for an hour.

```js
const res = await fetch("https://hypothesis.sh/datasets/periodic_table");
const { data, license } = await res.json();
console.log(license.attribution); // show this wherever the data appears
const metals = data.filter((e) => e.electrical_type === "Conductor");
```
