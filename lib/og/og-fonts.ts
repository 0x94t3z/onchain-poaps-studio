const fontSources = {
  display:
    "https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Bold.ttf",
  body:
    "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/fonts/ttf/DMSans-Regular.ttf",
} as const;

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

async function fetchFont(url: string) {
  const response = await fetch(url, { next: { revalidate: 604800 } });
  if (!response.ok) throw new Error(`Unable to load OG font: ${response.status}`);
  return response.arrayBuffer();
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const [display, body] = await Promise.allSettled([
    fetchFont(fontSources.display),
    fetchFont(fontSources.body),
  ]);
  const fonts: OgFont[] = [];

  if (display.status === "fulfilled") {
    fonts.push({
      name: "Space Grotesk",
      data: display.value,
      weight: 700,
      style: "normal",
    });
  }
  if (body.status === "fulfilled") {
    fonts.push({
      name: "DM Sans",
      data: body.value,
      weight: 400,
      style: "normal",
    });
  }

  return fonts;
}
