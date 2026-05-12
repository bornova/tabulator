## @bornova/tabulator-tables

This is a fork of [original tabulator-tables library](https://github.com/olifolkerd/tabulator).

For more information, please visit https://github.com/olifolkerd/tabulator.

## Setup

Include the library and the css:

```html
<link href="dist/css/themes/default/tabulator.min.css" rel="stylesheet" />
<script type="text/javascript" src="dist/js/browser/tabulator.min.js"></script>
```

Create an element to hold the table:

```html
<div id="example-table"></div>
```

Turn the element into a tabulator with some simple javascript:

```javascript
let table = new Tabulator('#example-table', {})
```

### NPM Installation

To get Tabulator via the NPM package manager, open a terminal in your project directory and run the following command:

```
npm install @bornova/tabulator-tables
```

### CDN - UNPKG

To access Tabulator directly from the UNPKG CDN servers, include the following two lines at the start of your project, instead of the locally hosted versions:

```html
<link href="https://unpkg.com/@bornova/tabulator-tables/dist/css/themes/default/tabulator.min.css" rel="stylesheet" />
<script
  type="text/javascript"
  src="https://unpkg.com/@bornova/tabulator-tables/dist/js/browser/tabulator.min.js"
></script>
```
