import { readFile } from "node:fs/promises";
import { type Browser, expect, type Page, test } from "@playwright/test";

const fixture = `
  <div id="fixture">
    <div id="group">
      <label id="label" class="form-label" for="input">Name</label>
      <input id="input" class="form-input" type="text" placeholder="Name">
    </div>
    <fieldset id="fieldset">
      <legend id="legend">Legend</legend>
    </fieldset>
    <label id="label-sm" class="form-label label-sm">Small label</label>
    <label id="label-lg" class="form-label label-lg">Large label</label>
    <input id="input-sm" class="form-input input-sm" type="text" placeholder="Small">
    <input id="input-lg" class="form-input input-lg" type="text" placeholder="Large">
    <input id="input-inline" class="form-input input-inline" type="text" placeholder="Inline">
    <input id="input-file" class="form-input" type="file">
    <textarea id="textarea" class="form-input" rows="3" placeholder="Textarea"></textarea>
    <p id="hint" class="form-input-hint">Hint</p>
    <div class="form-group has-success">
      <input id="success-input" class="form-input" type="text" placeholder="Success">
      <p id="success-hint" class="form-input-hint">Success hint</p>
    </div>
    <div class="form-group has-error">
      <input id="error-input" class="form-input" type="text" placeholder="Error">
      <p id="error-hint" class="form-input-hint">Error hint</p>
    </div>
    <input id="success-class" class="form-input is-success" type="text" placeholder="Success class">
    <select id="error-class" class="form-select is-error">
      <option>Error class</option>
    </select>
    <select id="select" class="form-select">
      <option>Choose an option</option>
      <option>Slack</option>
    </select>
    <select id="select-sm" class="form-select select-sm">
      <option>Small</option>
    </select>
    <select id="select-lg" class="form-select select-lg">
      <option>Large</option>
    </select>
    <select id="select-multiple" class="form-select" multiple>
      <option id="select-multiple-option">One</option>
      <option>Two</option>
    </select>
    <select id="select-size" class="form-select" size="2">
      <option>One</option>
      <option>Two</option>
    </select>
    <div id="icon-left" class="has-icon-left">
      <input id="input-icon-left" class="form-input" type="text" placeholder="Icon left">
      <i id="icon-left-icon" class="form-icon"></i>
    </div>
    <div id="icon-right" class="has-icon-right">
      <input id="input-icon-right" class="form-input input-sm" type="text" placeholder="Icon right">
      <i id="icon-right-icon" class="form-icon"></i>
    </div>
    <label id="checkbox" class="form-checkbox">
      <input id="checkbox-input" type="checkbox">
      <i id="checkbox-icon" class="form-icon"></i> Checkbox
    </label>
    <label id="checkbox-checked" class="form-checkbox">
      <input id="checkbox-checked-input" type="checkbox" checked>
      <i id="checkbox-checked-icon" class="form-icon"></i> Checked
    </label>
    <label id="checkbox-indeterminate" class="form-checkbox">
      <input id="checkbox-indeterminate-input" type="checkbox">
      <i id="checkbox-indeterminate-icon" class="form-icon"></i> Indeterminate
    </label>
    <label id="checkbox-sm" class="form-checkbox input-sm">
      <input type="checkbox">
      <i id="checkbox-sm-icon" class="form-icon"></i> Small
    </label>
    <label id="checkbox-lg" class="form-checkbox input-lg">
      <input type="checkbox">
      <i id="checkbox-lg-icon" class="form-icon"></i> Large
    </label>
    <label id="radio" class="form-radio">
      <input id="radio-input" type="radio" name="radio">
      <i id="radio-icon" class="form-icon"></i> Radio
    </label>
    <label id="radio-checked" class="form-radio">
      <input id="radio-checked-input" type="radio" name="radio" checked>
      <i id="radio-checked-icon" class="form-icon"></i> Checked radio
    </label>
    <label id="switch" class="form-switch">
      <input id="switch-input" type="checkbox">
      <i id="switch-icon" class="form-icon"></i> Switch
    </label>
    <label id="switch-checked" class="form-switch">
      <input id="switch-checked-input" type="checkbox" checked>
      <i id="switch-checked-icon" class="form-icon"></i> Checked switch
    </label>
    <div class="form-group has-error">
      <label id="error-checkbox" class="form-checkbox">
        <input id="error-checkbox-input" type="checkbox" checked>
        <i id="error-checkbox-icon" class="form-icon"></i> Error checkbox
      </label>
      <label id="error-radio" class="form-radio">
        <input id="error-radio-input" type="radio" name="error-radio" checked>
        <i id="error-radio-icon" class="form-icon"></i> Error radio
      </label>
      <label id="error-switch" class="form-switch">
        <input id="error-switch-input" type="checkbox" checked>
        <i id="error-switch-icon" class="form-icon"></i> Error switch
      </label>
      <label id="error-checkbox-indeterminate" class="form-checkbox is-error">
        <input id="error-checkbox-indeterminate-input" type="checkbox">
        <i id="error-checkbox-indeterminate-icon" class="form-icon"></i> Error indeterminate
      </label>
    </div>
    <div id="input-group" class="input-group">
      <span id="addon" class="input-group-addon">addon</span>
      <input id="group-input" class="form-input" type="text" placeholder="Group">
      <button id="group-btn" class="btn input-group-btn" type="button">Go</button>
    </div>
    <div id="input-group-sm" class="input-group">
      <span id="addon-sm" class="input-group-addon addon-sm">small</span>
      <input id="group-input-sm" class="form-input input-sm" type="text">
    </div>
    <div id="input-group-lg" class="input-group">
      <span id="addon-lg" class="input-group-addon addon-lg">large</span>
      <input id="group-input-lg" class="form-input input-lg" type="text">
    </div>
    <div id="input-group-select" class="input-group">
      <input id="group-select-input" class="form-input" type="text">
      <select id="group-select" class="form-select">
        <option>Slack</option>
      </select>
    </div>
    <div id="input-group-borders" class="input-group">
      <input id="group-first" class="form-input" type="text">
      <input id="group-middle" class="form-input" type="text">
      <input id="group-last" class="form-input" type="text">
    </div>
    <div id="input-group-inline" class="input-group input-inline">
      <input id="group-inline-input" class="form-input" type="text">
      <button class="btn input-group-btn" type="button">Go</button>
    </div>
    <form id="horizontal" class="form-horizontal">
      <div id="horizontal-group" class="form-group">
        <input id="horizontal-input" class="form-input" type="text">
      </div>
    </form>
    <div id="inline" class="form-inline">
      <input id="inline-input" class="form-input" type="text">
    </div>
    <input id="disabled-input" class="form-input" type="text" disabled>
    <input id="disabled-class-input" class="form-input disabled" type="text">
    <select id="disabled-select" class="form-select" disabled>
      <option>Disabled</option>
    </select>
    <input id="readonly-input" class="form-input" type="text" readonly>
    <label class="form-checkbox">
      <input id="disabled-checkbox-input" type="checkbox" disabled>
      <i id="disabled-checkbox-icon" class="form-icon"></i> Disabled checkbox
    </label>
    <label class="form-switch">
      <input id="disabled-switch-input" type="checkbox" disabled checked>
      <i id="disabled-switch-icon" class="form-icon"></i> Disabled switch
    </label>
    <div class="form-group">
      <input id="pattern" class="form-input" type="email" placeholder="Email" pattern="[a-z]+@[a-z]+[.][a-z]+">
      <p id="pattern-hint" class="form-input-hint">Enter an email</p>
    </div>
  </div>
`;

const fixtureCss = `
  #fixture { background: #fff; box-sizing: border-box; padding: 20px; width: 900px; }
  #fixture * { animation: none !important; transition: none !important; }
  #fixture input, #fixture textarea { caret-color: transparent; }
  #fixture > * { margin-bottom: 8px; }
`;

const styleProperties = [
  "appearance",
  "backgroundColor",
  "backgroundClip",
  "backgroundImage",
  "backgroundPosition",
  "backgroundRepeat",
  "backgroundSize",
  "borderBottomColor",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderBottomStyle",
  "borderBottomWidth",
  "borderLeftColor",
  "borderLeftStyle",
  "borderLeftWidth",
  "borderRadius",
  "borderRightColor",
  "borderRightStyle",
  "borderRightWidth",
  "borderTopColor",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderTopStyle",
  "borderTopWidth",
  "boxShadow",
  "color",
  "cursor",
  "display",
  "flex",
  "flexWrap",
  "fontSize",
  "fontWeight",
  "height",
  "left",
  "lineHeight",
  "margin",
  "marginBottom",
  "marginLeft",
  "marginTop",
  "maxWidth",
  "minHeight",
  "opacity",
  "outlineStyle",
  "padding",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "position",
  "right",
  "top",
  "transform",
  "transitionDuration",
  "transitionProperty",
  "verticalAlign",
  "whiteSpace",
  "width",
  "zIndex",
] as const;

const pseudoProperties = [
  "backgroundColor",
  "borderColor",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRadius",
  "borderTopWidth",
  "content",
  "height",
  "left",
  "marginLeft",
  "marginTop",
  "position",
  "top",
  "transform",
  "width",
] as const;

let legacyCss: string;
let spectraCss: string;

/*
 * WebKit reports rem-based computed values on single <select> controls against
 * the initial 16px root when :root declares custom properties. The rendered
 * control matches the 20px root, so the screenshot comparison remains exact;
 * only the reported computed values are skipped on WebKit.
 */
const webkitSelectSelectors = new Set([
  "#error-class",
  "#select",
  "#select-sm",
  "#select-lg",
  "#group-select",
  "#input-group-select",
  "#disabled-select",
]);

function comparableSelectors(browserName: string, selectors: string[]) {
  return browserName === "webkit"
    ? selectors.filter((selector) => !webkitSelectSelectors.has(selector))
    : selectors;
}

test.beforeAll(async () => {
  [legacyCss, spectraCss] = await Promise.all([
    readFile("dist/spectre.css", "utf8"),
    readFile("build/phase-01/spectra.css", "utf8"),
  ]);
});

async function render(page: Page, css: string, additionalCss = "") {
  await page.setContent(`<style>${css}\n${fixtureCss}\n${additionalCss}</style>${fixture}`);
  await page.locator("#checkbox-indeterminate-input").evaluate((element) => {
    (element as HTMLInputElement).indeterminate = true;
  });
  await page.locator("#error-checkbox-indeterminate-input").evaluate((element) => {
    (element as HTMLInputElement).indeterminate = true;
  });
}

async function styles(page: Page, selectors: string[]) {
  return page.evaluate(
    ({ selectors, properties }) => {
      const snapshot: Record<string, Record<string, string>> = {};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element) {
          snapshot[selector] = { missing: "true" };
          continue;
        }
        const style = getComputedStyle(element);
        const values: Record<string, string> = {};
        for (const property of properties) {
          values[property] = style[property as keyof CSSStyleDeclaration] as string;
        }
        snapshot[selector] = values;
      }
      return snapshot;
    },
    { selectors, properties: styleProperties },
  );
}

async function pseudoStyles(page: Page, selectors: string[]) {
  return page.evaluate(
    ({ selectors, properties }) => {
      const snapshot: Record<string, Record<string, string>> = {};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element) {
          snapshot[selector] = { missing: "true" };
          continue;
        }
        const style = getComputedStyle(element, "::before");
        const values: Record<string, string> = {};
        for (const property of properties) {
          values[property] = style[property as keyof CSSStyleDeclaration] as string;
        }
        snapshot[selector] = values;
      }
      return snapshot;
    },
    { selectors, properties: pseudoProperties },
  );
}

async function withTwoPages(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 1200 } });
  const legacy = await context.newPage();
  const spectra = await context.newPage();
  await Promise.all([render(legacy, legacyCss), render(spectra, spectraCss)]);
  return { context, legacy, spectra };
}

test("matches legacy form control styles and representative pixels", async ({
  browser,
  browserName,
}) => {
  const { context, legacy, spectra } = await withTwoPages(browser);
  const selectors = [
    "#group",
    "#fieldset",
    "#legend",
    "#label",
    "#label-sm",
    "#label-lg",
    "#input",
    "#input-sm",
    "#input-lg",
    "#input-inline",
    "#input-file",
    "#textarea",
    "#hint",
    "#success-input",
    "#success-hint",
    "#error-input",
    "#error-hint",
    "#success-class",
    "#error-class",
    "#select",
    "#select-sm",
    "#select-lg",
    "#select-multiple",
    "#select-multiple-option",
    "#select-size",
    "#icon-left",
    "#icon-left-icon",
    "#input-icon-left",
    "#icon-right",
    "#icon-right-icon",
    "#input-icon-right",
    "#horizontal",
    "#horizontal-group",
    "#inline",
    "#inline-input",
  ];

  expect(await styles(spectra, comparableSelectors(browserName, selectors))).toEqual(
    await styles(legacy, comparableSelectors(browserName, selectors)),
  );

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("matches legacy check, radio, and switch states", async ({ browser }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);
  const selectors = [
    "#checkbox",
    "#checkbox-input",
    "#checkbox-icon",
    "#checkbox-checked",
    "#checkbox-checked-input",
    "#checkbox-checked-icon",
    "#checkbox-indeterminate",
    "#checkbox-indeterminate-icon",
    "#checkbox-sm",
    "#checkbox-sm-icon",
    "#checkbox-lg",
    "#checkbox-lg-icon",
    "#radio",
    "#radio-icon",
    "#radio-checked",
    "#radio-checked-icon",
    "#switch",
    "#switch-icon",
    "#switch-checked",
    "#switch-checked-icon",
    "#error-checkbox-icon",
    "#error-radio-icon",
    "#error-switch-icon",
    "#error-checkbox-indeterminate-icon",
  ];

  expect(await styles(spectra, selectors)).toEqual(await styles(legacy, selectors));
  expect(
    await pseudoStyles(spectra, [
      "#checkbox-checked-icon",
      "#checkbox-indeterminate-icon",
      "#radio-checked-icon",
      "#switch-icon",
      "#switch-checked-icon",
      "#error-checkbox-indeterminate-icon",
    ]),
  ).toEqual(
    await pseudoStyles(legacy, [
      "#checkbox-checked-icon",
      "#checkbox-indeterminate-icon",
      "#radio-checked-icon",
      "#switch-icon",
      "#switch-checked-icon",
      "#error-checkbox-indeterminate-icon",
    ]),
  );

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("matches legacy focus, pressed, disabled, readonly, and validation states", async ({
  browser,
  browserName,
}) => {
  const { context, legacy, spectra } = await withTwoPages(browser);

  await Promise.all([legacy.locator("#input").focus(), spectra.locator("#input").focus()]);
  expect(await styles(spectra, ["#input"])).toEqual(await styles(legacy, ["#input"]));
  await expect(spectra.locator("#input")).toHaveCSS("border-color", "rgb(87, 85, 217)");

  await Promise.all([
    legacy.locator("#checkbox-checked-input").focus(),
    spectra.locator("#checkbox-checked-input").focus(),
  ]);
  expect(await styles(spectra, ["#checkbox-checked-icon"])).toEqual(
    await styles(legacy, ["#checkbox-checked-icon"]),
  );

  const checkboxBox = await spectra.locator("#checkbox-input").boundingBox();
  const legacyCheckboxBox = await legacy.locator("#checkbox-input").boundingBox();
  if (!checkboxBox || !legacyCheckboxBox) {
    throw new Error("checkbox input is not hit-testable");
  }
  await Promise.all([
    legacy.mouse.move(
      legacyCheckboxBox.x + legacyCheckboxBox.width / 2,
      legacyCheckboxBox.y + legacyCheckboxBox.height / 2,
    ),
    spectra.mouse.move(
      checkboxBox.x + checkboxBox.width / 2,
      checkboxBox.y + checkboxBox.height / 2,
    ),
  ]);
  await Promise.all([legacy.mouse.down(), spectra.mouse.down()]);
  expect(await styles(spectra, ["#checkbox-icon"])).toEqual(
    await styles(legacy, ["#checkbox-icon"]),
  );
  await Promise.all([legacy.mouse.up(), spectra.mouse.up()]);

  await Promise.all([
    legacy.locator("#pattern").fill("invalid"),
    spectra.locator("#pattern").fill("invalid"),
  ]);
  expect(await styles(spectra, ["#pattern", "#pattern-hint"])).toEqual(
    await styles(legacy, ["#pattern", "#pattern-hint"]),
  );
  await expect(spectra.locator("#pattern")).toHaveCSS("border-color", "rgb(232, 86, 0)");
  await Promise.all([legacy.locator("#pattern").focus(), spectra.locator("#pattern").focus()]);
  expect(await styles(spectra, ["#pattern", "#pattern-hint"])).toEqual(
    await styles(legacy, ["#pattern", "#pattern-hint"]),
  );

  expect(
    await styles(
      spectra,
      comparableSelectors(browserName, [
        "#disabled-input",
        "#disabled-class-input",
        "#disabled-select",
        "#readonly-input",
        "#disabled-checkbox-icon",
        "#disabled-switch-icon",
      ]),
    ),
  ).toEqual(
    await styles(
      legacy,
      comparableSelectors(browserName, [
        "#disabled-input",
        "#disabled-class-input",
        "#disabled-select",
        "#readonly-input",
        "#disabled-checkbox-icon",
        "#disabled-switch-icon",
      ]),
    ),
  );
  await expect(spectra.locator("#disabled-input")).toHaveCSS(
    "background-color",
    "rgb(238, 240, 243)",
  );
  await expect(spectra.locator("#readonly-input")).toHaveCSS(
    "background-color",
    "rgb(247, 248, 249)",
  );
  await context.close();
});

test("matches legacy input groups", async ({ browser, browserName }) => {
  const { context, legacy, spectra } = await withTwoPages(browser);
  const selectors = [
    "#input-group",
    "#addon",
    "#group-input",
    "#group-btn",
    "#input-group-sm",
    "#addon-sm",
    "#group-input-sm",
    "#input-group-lg",
    "#addon-lg",
    "#group-input-lg",
    "#input-group-select",
    "#group-select",
    "#input-group-borders",
    "#group-first",
    "#group-middle",
    "#group-last",
    "#input-group-inline",
    "#group-inline-input",
  ];

  expect(await styles(spectra, comparableSelectors(browserName, selectors))).toEqual(
    await styles(legacy, comparableSelectors(browserName, selectors)),
  );

  await Promise.all([
    legacy.locator("#group-middle").focus(),
    spectra.locator("#group-middle").focus(),
  ]);
  expect(await styles(spectra, ["#group-middle"])).toEqual(await styles(legacy, ["#group-middle"]));

  const [legacyScreenshot, spectraScreenshot] = await Promise.all([
    legacy.locator("#fixture").screenshot(),
    spectra.locator("#fixture").screenshot(),
  ]);
  expect(spectraScreenshot).toEqual(legacyScreenshot);
  await context.close();
});

test("supports global and nested control token overrides", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      :root {
        --spectra-color-primary: rgb(1 2 3);
        --spectra-color-border-dark: rgb(4 5 6);
        --spectra-color-text-subtle: rgb(7 8 9);
        --spectra-color-focus-ring: rgb(10 11 12 / 30%);
        --spectra-color-success-surface: rgb(13 14 15);
        --spectra-color-error-surface: rgb(16 17 18);
        --spectra-control-padding-x: 7px;
        --spectra-control-padding-y: 3px;
      }
      .theme-a {
        --spectra-color-border-dark: rgb(20 21 22);
        --spectra-color-text-subtle: rgb(23 24 25);
        --spectra-control-padding-x: 9px;
        --spectra-color-success-surface: rgb(26 27 28);
      }
    `,
  );
  await page.locator("#fixture").evaluate((element) => {
    element.innerHTML = `
      <input id="global-input" class="form-input" type="text" placeholder="Global">
      <p id="global-hint" class="form-input-hint">Global hint</p>
      <div class="has-success"><input id="global-success" class="form-input" type="text"></div>
      <div class="theme-a">
        <input id="a-input" class="form-input" type="text" placeholder="A">
        <p id="a-hint" class="form-input-hint">A hint</p>
        <div class="has-success"><input id="a-success" class="form-input" type="text"></div>
      </div>
      <input id="after-input" class="form-input" type="text" placeholder="After">
    `;
  });

  await expect(page.locator("#global-input")).toHaveCSS("padding", "3px 7px");
  await expect(page.locator("#global-input")).toHaveCSS("border-color", "rgb(4, 5, 6)");
  await expect(page.locator("#global-hint")).toHaveCSS("color", "rgb(7, 8, 9)");
  await expect(page.locator("#global-success")).toHaveCSS("background-color", "rgb(13, 14, 15)");
  await expect(page.locator("#a-input")).toHaveCSS("padding", "3px 9px");
  await expect(page.locator("#a-input")).toHaveCSS("border-color", "rgb(20, 21, 22)");
  await expect(page.locator("#a-hint")).toHaveCSS("color", "rgb(23, 24, 25)");
  await expect(page.locator("#a-success")).toHaveCSS("background-color", "rgb(26, 27, 28)");
  await expect(page.locator("#after-input")).toHaveCSS("padding", "3px 7px");
  await expect(page.locator("#after-input")).toHaveCSS("border-color", "rgb(4, 5, 6)");

  await page.locator("#global-input").focus();
  await expect
    .poll(() =>
      page.locator("#global-input").evaluate((element) => getComputedStyle(element).boxShadow),
    )
    .toContain("rgba(10, 11, 12, 0.3)");
  await page.locator("#a-input").focus();
  await expect(page.locator("#a-input")).toHaveCSS("border-color", "rgb(1, 2, 3)");
});

test("preserves a later external override", async ({ page }) => {
  await render(
    page,
    spectraCss,
    `
      .form-input { border-color: rgb(1 2 3); }
      .form-checkbox .form-icon { background: rgb(4 5 6); }
      .input-group .input-group-addon { background: rgb(7 8 9); }
    `,
  );

  await expect(page.locator("#input")).toHaveCSS("border-color", "rgb(1, 2, 3)");
  await expect(page.locator("#checkbox-icon")).toHaveCSS("background-color", "rgb(4, 5, 6)");
  await expect(page.locator("#addon")).toHaveCSS("background-color", "rgb(7, 8, 9)");
});
