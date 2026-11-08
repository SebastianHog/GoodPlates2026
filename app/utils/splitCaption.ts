// Splits a caption into running text and runs of nutrition lines ("352 calories", "28.7g protein"),
// so the numbers can be set as small data instead of body text. Plain matching, no guessing:
// a run needs at least two lines in a row, each starting with a number and naming a nutrient.
export type CaptionBlock = { kind: "text"; text: string } | { kind: "facts"; items: string[] };

const NUTRIENT =
  /^~?\d[\d.,]*\s*(k?cal|kj|g|mg|µg|calories)?\s+(calories|kcal|cal|kj|protein|carbs?|carbohydrates|fat|saturated fat|fib(re|er)|sugars?|salt|sodium)\b/i;

export function splitCaption(caption: string): CaptionBlock[] {
  const blocks: CaptionBlock[] = [];
  const lines = caption.split("\n");
  let text: string[] = [];
  let i = 0;

  const flushText = () => {
    const joined = text.join("\n").trim();
    if (joined) blocks.push({ kind: "text", text: joined });
    text = [];
  };

  while (i < lines.length) {
    let end = i;
    while (end < lines.length && NUTRIENT.test(lines[end]!.trim())) end++;

    if (end - i >= 2) {
      flushText();
      blocks.push({ kind: "facts", items: lines.slice(i, end).map((line) => line.trim()) });
      i = end;
    } else {
      text.push(lines[i]!);
      i++;
    }
  }
  flushText();
  return blocks;
}
